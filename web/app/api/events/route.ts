import { NextRequest, NextResponse } from "next/server";
import { postgresPool } from "@/lib/postgres";

export async function GET() {
  try {
    const result = await postgresPool.query(`
      SELECT
        event_id,
        event_name,
        event_type,
        event_date,
        start_time,
        end_time,
        venue_city,
        expected_guests,
        status
      FROM events
      ORDER BY event_date ASC, start_time ASC
    `);

    return NextResponse.json({
      success: true,
      events: result.rows,
    });
  } catch (error) {
    console.error("Event retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve events",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      eventName,
      eventType,
      eventDate,
      startTime,
      endTime,
      venueCity,
      expectedGuests,
    } = body;

    if (
      !eventName ||
      !eventType ||
      !eventDate ||
      !startTime ||
      !endTime ||
      !venueCity ||
      !expectedGuests
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "All event fields are required",
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

    const organizerId = process.env.DEFAULT_ORGANIZER_ID;

    if (!organizerId) {
      return NextResponse.json(
        {
          success: false,
          error: "DEFAULT_ORGANIZER_ID is missing",
        },
        { status: 500 }
      );
    }

    const result = await postgresPool.query(
      `
        INSERT INTO events (
          organizer_id,
          event_name,
          event_type,
          event_date,
          start_time,
          end_time,
          venue_city,
          expected_guests,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT')
        RETURNING
          event_id,
          event_name,
          event_type,
          event_date,
          start_time,
          end_time,
          venue_city,
          expected_guests,
          status
      `,
      [
        organizerId,
        eventName.trim(),
        eventType.trim(),
        eventDate,
        startTime,
        endTime,
        venueCity.trim(),
        Number(expectedGuests),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        event: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Event creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create event",
      },
      { status: 500 }
    );
  }
}
