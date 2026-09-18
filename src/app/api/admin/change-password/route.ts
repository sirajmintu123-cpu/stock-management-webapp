import { NextResponse } from "next/server";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Admin access required.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is required.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be at least 8 characters long.",
        },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password and confirmation do not match.",
        },
        { status: 400 },
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from the current password.",
        },
        { status: 400 },
      );
    }

    const userResult = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const adminUser = userResult[0];

    if (!adminUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin account not found.",
        },
        { status: 404 },
      );
    }

    const passwordCorrect =
      await verifyPassword(
        currentPassword,
        adminUser.passwordHash,
      );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        { status: 400 },
      );
    }

    const newPasswordHash =
      await hashPassword(newPassword);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await tx
        .delete(sessions)
        .where(eq(sessions.userId, user.id));
    });

    return NextResponse.json({
      success: true,
      message:
        "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error(
      "Admin change password error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to change password.",
      },
      { status: 500 },
    );
  }
}