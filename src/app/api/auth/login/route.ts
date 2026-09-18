import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userCode = String(body.userCode || "").trim();
    const password = String(body.password || "");

    if (!userCode || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and password are required.",
        },
        { status: 400 },
      );
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.userCode, userCode))
      .limit(1);

    const user = result[0];

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid User ID or password.",
        },
        { status: 401 },
      );
    }

    const passwordValid = await verifyPassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid User ID or password.",
        },
        { status: 401 },
      );
    }

    const { sessionId, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        userCode: user.userCode,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "session_id",
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process login.",
      },
      { status: 500 },
    );
  }
}