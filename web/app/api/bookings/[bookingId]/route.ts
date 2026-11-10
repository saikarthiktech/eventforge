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

export async function PATCH(
  request: NextRequest,
  context: { params: { bookingId: string } }
) {
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
          error: "Only vendors can update booking requests",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newStatus = String(body.status || "").toUpperCase();
    const bookingId = context.params.bookingId;

    if (!["ACCEPTED", "REJECTED"].includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Status must be ACCEPTED or REJECTED",
        },
        { status: 400 }
      );
    }

    const result = await postgresPool.query(
      `
        UPDATE bookings b
        SET booking_status = $1
        FROM services s
        JOIN vendors v ON v.vendor_id = s.vendor_id
        WHERE b.booking_id = $2
          AND b.service_id = s.service_id
          AND v.owner_user_id = $3
          AND b.booking_status = 'PENDING'
        RETURNING
          b.booking_id,
          b.event_id,
          b.service_id,
          b.agreed_price,
          b.booking_status,
          b.booked_at
      `,
      [newStatus, bookingId, sessionUser.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Pending booking not found for this vendor",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${newStatus.toLowerCase()} successfully`,
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Booking status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update booking status",
      },
      { status: 500 }
    );
  }
}
