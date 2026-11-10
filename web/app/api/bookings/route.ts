import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { postgresPool } from "@/lib/postgres";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing from .env.local");
  }

  return new TextEncoder().encode(secret);
}

async function getSessionUser(request: NextRequest) {
  const sessionCookie = request.cookies.get("eventforge_session");

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      sessionCookie.value,
      getAuthSecret()
    );

    return {
      userId: String(payload.userId),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in",
        },
        { status: 401 }
      );
    }

    const values: string[] = [];
    const conditions: string[] = [];

    if (sessionUser.role === "ORGANIZER") {
      values.push(sessionUser.userId);
      conditions.push(`e.organizer_id = $${values.length}`);
    } else if (sessionUser.role === "VENDOR") {
      values.push(sessionUser.userId);
      conditions.push(`v.owner_user_id = $${values.length}`);
    } else {
      conditions.push("TRUE");
    }

    const result = await postgresPool.query(
      `
        SELECT
          b.booking_id,
          b.event_id,
          b.service_id,
          b.agreed_price,
          b.booking_status,
          b.booked_at,
          e.event_name,
          e.event_date,
          e.start_time,
          e.end_time,
          v.business_name,
          s.service_name
        FROM bookings b
        JOIN events e ON e.event_id = b.event_id
        JOIN services s ON s.service_id = b.service_id
        JOIN vendors v ON v.vendor_id = s.vendor_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY b.booked_at DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Booking retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve bookings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = await postgresPool.connect();

  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in",
        },
        { status: 401 }
      );
    }

    if (sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          success: false,
          error: "Only organizers can request bookings",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const eventId = String(body.eventId || "").trim();
    const serviceId = String(body.serviceId || "").trim();

    if (!eventId || !serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID and service ID are required",
        },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const eventResult = await client.query(
      `
        SELECT
          event_id,
          event_name,
          event_date,
          start_time,
          end_time
        FROM events
        WHERE event_id = $1
          AND organizer_id = $2
          AND status <> 'CANCELLED'
        FOR UPDATE
      `,
      [eventId, sessionUser.userId]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "Event not found or does not belong to you",
        },
        { status: 404 }
      );
    }

    const event = eventResult.rows[0];

    const serviceResult = await client.query(
      `
        SELECT
          s.service_id,
          s.service_name,
          s.base_price,
          v.business_name,
          v.vendor_id
        FROM services s
        JOIN vendors v ON v.vendor_id = s.vendor_id
        WHERE s.service_id = $1
          AND s.active = TRUE
          AND v.approval_status = 'APPROVED'
      `,
      [serviceId]
    );

    if (serviceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "Approved active service not found",
        },
        { status: 404 }
      );
    }

    const service = serviceResult.rows[0];

    const slotResult = await client.query(
      `
        SELECT
          slot_id,
          slot_date,
          start_time,
          end_time,
          status
        FROM availability_slots
        WHERE service_id = $1
          AND slot_date = $2
          AND status = 'AVAILABLE'
          AND start_time <= $3
          AND end_time >= $4
        ORDER BY start_time
        LIMIT 1
        FOR UPDATE
      `,
      [
        serviceId,
        event.event_date,
        event.start_time,
        event.end_time,
      ]
    );

    if (slotResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "No available vendor slot covers this event time",
        },
        { status: 409 }
      );
    }

    const slot = slotResult.rows[0];

    const duplicateBooking = await client.query(
      `
        SELECT booking_id
        FROM bookings
        WHERE event_id = $1
          AND service_id = $2
          AND booking_status IN ('PENDING', 'ACCEPTED')
      `,
      [eventId, serviceId]
    );

    if (duplicateBooking.rows.length > 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "This service has already been requested for the event",
        },
        { status: 409 }
      );
    }

    const bookingResult = await client.query(
      `
        INSERT INTO bookings (
          event_id,
          service_id,
          agreed_price,
          booking_status
        )
        VALUES ($1, $2, $3, 'PENDING')
        RETURNING
          booking_id,
          event_id,
          service_id,
          agreed_price,
          booking_status,
          booked_at
      `,
      [eventId, serviceId, service.base_price]
    );

    await client.query(
      `
        UPDATE availability_slots
        SET status = 'BOOKED'
        WHERE slot_id = $1
      `,
      [slot.slot_id]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Booking request created successfully",
        booking: {
          ...bookingResult.rows[0],
          event_name: event.event_name,
          business_name: service.business_name,
          service_name: service.service_name,
        },
      },
      { status: 201 }
    );
    } catch (error) {
    await client.query("ROLLBACK");

    console.error("Booking creation failed:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P0001" &&
      "message" in error
    ) {
      return NextResponse.json(
        {
          success: false,
          error: String(error.message),
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create booking request",
      },
      { status: 500 }
    );
  } finally {

    client.release();
  }
}
