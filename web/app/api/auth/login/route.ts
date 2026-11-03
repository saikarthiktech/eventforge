import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { postgresPool } from "@/lib/postgres";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing from .env.local");
  }

  return new TextEncoder().encode(secret);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const result = await postgresPool.query(
      `
        SELECT user_id, full_name, email, password_hash, role
        FROM users
        WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      userId: user.user_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(getAuthSecret());

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("eventforge_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to complete login",
      },
      { status: 500 }
    );
  }
}
