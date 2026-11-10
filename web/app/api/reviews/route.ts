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
    const vendorId = request.nextUrl.searchParams.get("vendorId");

    const values: string[] = [];
    let query = `
      SELECT
        r.review_id,
        r.event_id,
        r.vendor_id,
        r.reviewer_id,
        r.rating,
        r.comment,
        r.created_at,
        v.business_name,
        u.full_name AS reviewer_name
      FROM reviews r
      JOIN vendors v ON v.vendor_id = r.vendor_id
      JOIN users u ON u.user_id = r.reviewer_id
    `;

    if (vendorId) {
      values.push(vendorId);
      query += ` WHERE r.vendor_id = $${values.length}`;
    }

    query += " ORDER BY r.created_at DESC";

    const result = await postgresPool.query(query, values);

    return NextResponse.json({
      success: true,
      reviews: result.rows,
    });
  } catch (error) {
    console.error("Review retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve reviews",
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

    if (sessionUser.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          success: false,
          error: "Only organizers can submit reviews",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const eventId = String(body.eventId || "").trim();
    const vendorId = String(body.vendorId || "").trim();
    const comment = String(body.comment || "").trim();
    const rating = Number(body.rating);

    if (!eventId || !vendorId || !comment || !rating) {
      return NextResponse.json(
        {
          success: false,
          error: "Event, vendor, rating, and comment are required",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating must be a whole number from 1 to 5",
        },
        { status: 400 }
      );
    }

    const eligibleBooking = await postgresPool.query(
      `
        SELECT b.booking_id
        FROM bookings b
        JOIN events e ON e.event_id = b.event_id
        JOIN services s ON s.service_id = b.service_id
        WHERE b.event_id = $1
          AND e.organizer_id = $2
          AND s.vendor_id = $3
          AND b.booking_status IN ('ACCEPTED', 'COMPLETED')
        LIMIT 1
      `,
      [eventId, sessionUser.userId, vendorId]
    );

    if (eligibleBooking.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can review a vendor only after an accepted or completed booking",
        },
        { status: 403 }
      );
    }

    const duplicateReview = await postgresPool.query(
      `
        SELECT review_id
        FROM reviews
        WHERE event_id = $1
          AND vendor_id = $2
          AND reviewer_id = $3
      `,
      [eventId, vendorId, sessionUser.userId]
    );

    if (duplicateReview.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already reviewed this vendor for this event",
        },
        { status: 409 }
      );
    }

    const result = await postgresPool.query(
      `
        INSERT INTO reviews (
          event_id,
          vendor_id,
          reviewer_id,
          rating,
          comment
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          review_id,
          event_id,
          vendor_id,
          reviewer_id,
          rating,
          comment,
          created_at
      `,
      [
        eventId,
        vendorId,
        sessionUser.userId,
        rating,
        comment,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully",
        review: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Review creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to submit review",
      },
      { status: 500 }
    );
  }
}
