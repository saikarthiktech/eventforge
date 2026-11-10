import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { postgresPool } from "@/lib/postgres";

const allowedPaymentMethods = [
  "CARD",
  "UPI",
  "BANK_TRANSFER",
  "CASH",
];

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
          p.payment_id,
          p.event_id,
          p.booking_id,
          p.amount,
          p.payment_status,
          p.payment_method,
          p.paid_at,
          e.event_name,
          e.event_date,
          v.business_name,
          s.service_name
        FROM payments p
        JOIN events e ON e.event_id = p.event_id
        JOIN bookings b ON b.booking_id = p.booking_id
        JOIN services s ON s.service_id = b.service_id
        JOIN vendors v ON v.vendor_id = s.vendor_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY p.payment_id DESC
      `,
      values
    );

    return NextResponse.json({
      success: true,
      payments: result.rows,
    });
  } catch (error) {
    console.error("Payment retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve payments",
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
          error: "Only organizers can create payment records",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const bookingId = String(body.bookingId || "").trim();
    const paymentMethod = String(body.paymentMethod || "")
      .trim()
      .toUpperCase();

    if (!bookingId || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID and payment method are required",
        },
        { status: 400 }
      );
    }

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment method must be CARD, UPI, BANK_TRANSFER, or CASH",
        },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `
        SELECT
          b.booking_id,
          b.event_id,
          b.agreed_price,
          b.booking_status,
          e.event_name
        FROM bookings b
        JOIN events e ON e.event_id = b.event_id
        WHERE b.booking_id = $1
          AND e.organizer_id = $2
        FOR UPDATE
      `,
      [bookingId, sessionUser.userId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "Booking not found for this organizer",
        },
        { status: 404 }
      );
    }

    const booking = bookingResult.rows[0];

    if (
      booking.booking_status !== "ACCEPTED" &&
      booking.booking_status !== "PENDING"
    ) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "Payment cannot be created for this booking status",
        },
        { status: 409 }
      );
    }

    const existingPayment = await client.query(
      `
        SELECT payment_id
        FROM payments
        WHERE booking_id = $1
          AND payment_status IN ('PENDING', 'PAID')
      `,
      [bookingId]
    );

    if (existingPayment.rows.length > 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          error: "A payment record already exists for this booking",
        },
        { status: 409 }
      );
    }

    const paymentResult = await client.query(
      `
        INSERT INTO payments (
          event_id,
          booking_id,
          amount,
          payment_status,
          payment_method
        )
        VALUES ($1, $2, $3, 'PENDING', $4)
        RETURNING
          payment_id,
          event_id,
          booking_id,
          amount,
          payment_status,
          payment_method,
          paid_at
      `,
      [
        booking.event_id,
        booking.booking_id,
        booking.agreed_price,
        paymentMethod,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Payment record created successfully",
        payment: {
          ...paymentResult.rows[0],
          event_name: booking.event_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Payment creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create payment record",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
