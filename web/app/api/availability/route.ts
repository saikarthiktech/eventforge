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
    const serviceId = request.nextUrl.searchParams.get("serviceId");
    const slotDate = request.nextUrl.searchParams.get("date");

    const values: string[] = [];
    const conditions: string[] = [
      "a.status = 'AVAILABLE'",
    ];

    if (serviceId) {
      values.push(serviceId);
      conditions.push(`a.service_id = $${values.length}`);
    }

    if (slotDate) {
      values.push(slotDate);
      conditions.push(`a.slot_date = $${values.length}`);
    }

    const result = await postgresPool.query(
      `
        SELECT
          a.slot_id,
          a.service_id,
          a.slot_date,
          a.start_time,
          a.end_time,
          a.status,
          s.service_name,
          v.vendor_id,
          v.business_name
        FROM availability_slots a
        JOIN services s ON s.service_id = a.service_id
        JOIN vendors v ON v.vendor_id = s.vendor_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY a.slot_date, a.start_time
      `,
      values
    );

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      slots: result.rows,
    });
  } catch (error) {
    console.error("Availability retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve availability",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (sessionUser.role !== "VENDOR") {
      return NextResponse.json(
        {
          success: false,
          error: "Only vendors can add availability",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const serviceId = String(body.serviceId || "").trim();
    const slotDate = String(body.slotDate || "").trim();
    const startTime = String(body.startTime || "").trim();
    const endTime = String(body.endTime || "").trim();

    if (!serviceId || !slotDate || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Service, date, start time, and end time are required",
        },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        {
          success: false,
          error: "End time must be later than start time",
        },
        { status: 400 }
      );
    }

    const ownedService = await postgresPool.query(
      `
        SELECT s.service_id
        FROM services s
        JOIN vendors v ON v.vendor_id = s.vendor_id
        WHERE s.service_id = $1
          AND v.owner_user_id = $2
          AND v.approval_status = 'APPROVED'
      `,
      [serviceId, sessionUser.userId]
    );

    if (ownedService.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only add availability for your own approved service",
        },
        { status: 403 }
      );
    }

    const overlap = await postgresPool.query(
      `
        SELECT slot_id
        FROM availability_slots
        WHERE service_id = $1
          AND slot_date = $2
          AND start_time < $4
          AND end_time > $3
      `,
      [serviceId, slotDate, startTime, endTime]
    );

    if (overlap.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This service already has an overlapping availability slot",
        },
        { status: 409 }
      );
    }

    const result = await postgresPool.query(
      `
        INSERT INTO availability_slots (
          service_id,
          slot_date,
          start_time,
          end_time,
          status
        )
        VALUES ($1, $2, $3, $4, 'AVAILABLE')
        RETURNING
          slot_id,
          service_id,
          slot_date,
          start_time,
          end_time,
          status
      `,
      [serviceId, slotDate, startTime, endTime]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Availability slot created",
        slot: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Availability creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create availability slot",
      },
      { status: 500 }
    );
  }
}
