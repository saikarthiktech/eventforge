import { NextRequest, NextResponse } from "next/server";
import { mongoClientPromise } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";

    const mongoClient = await mongoClientPromise;
    const database = mongoClient.db("eventforge");
    const collection = database.collection("vendor_profiles");

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$text = { $search: search };
    }

    const vendors = await collection
      .find(filter)
      .project({
        _id: 0,
        vendorId: 1,
        businessName: 1,
        category: 1,
        serviceAreas: 1,
        bio: 1,
        services: 1,
      })
      .toArray();

    return NextResponse.json({
      success: true,
      count: vendors.length,
      vendors,
    });
  } catch (error) {
    console.error("Vendor search failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve vendors",
      },
      { status: 500 }
    );
  }
}
