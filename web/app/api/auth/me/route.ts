import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing from .env.local");
  }

  return new TextEncoder().encode(secret);
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("eventforge_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(
      sessionCookie.value,
      getAuthSecret()
    );

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        userId: payload.userId,
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Session verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Invalid or expired session",
      },
      { status: 401 }
    );
  }
}
