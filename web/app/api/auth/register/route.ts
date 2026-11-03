import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { postgresPool } from "@/lib/postgres";

const allowedRoles = ["ORGANIZER", "VENDOR"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "ORGANIZER").toUpperCase();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name, email, and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must contain at least 8 characters",
        },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Role must be ORGANIZER or VENDOR",
        },
        { status: 400 }
      );
    }

    const existingUser = await postgresPool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await postgresPool.query(
      `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4)
        RETURNING user_id, full_name, email, role, created_at
      `,
      [fullName, email, passwordHash, role]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create account",
      },
      { status: 500 }
    );
  }
}
