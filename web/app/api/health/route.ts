import { NextResponse } from "next/server";
import { postgresPool } from "@/lib/postgres";
import { mongoClientPromise } from "@/lib/mongodb";

export async function GET() {
  try {
    const postgresResult = await postgresPool.query(
      "SELECT current_database() AS database_name, NOW() AS server_time"
    );

    const mongoClient = await mongoClientPromise;
    const mongoDatabase = mongoClient.db("eventforge");
    const vendorCount = await mongoDatabase
      .collection("vendor_profiles")
      .countDocuments();

    return NextResponse.json({
      success: true,
      postgresql: {
        connected: true,
        database: postgresResult.rows[0].database_name,
        serverTime: postgresResult.rows[0].server_time,
      },
      mongodb: {
        connected: true,
        vendorProfiles: vendorCount,
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}

