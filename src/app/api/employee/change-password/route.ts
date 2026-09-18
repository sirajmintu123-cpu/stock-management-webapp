import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    // Employee only
    if (currentUser.role !== "EMPLOYEE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. Employee access required.",
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

    // Basic validation
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password, new password and confirmation are required.",
        },
        { status: 400 },
      );
    }

    // Minimum password requirement
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

    // Confirm new password
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password and confirmation password do not match.",
        },
        { status: 400 },
      );
    }

    // Prevent using the same password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from the current password.",
        },
        { status: 400 },
      );
    }

    // Get the authenticated employee's password hash
    const userResult = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    const user = userResult[0];

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee account is not active.",
        },
        { status: 403 },
      );
    }

    // Verify current password
    const passwordMatches =
      await verifyPassword(
        currentPassword,
        user.passwordHash,
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        { status: 400 },
      );
    }

    // Hash the new password
    const newPasswordHash =
      await hashPassword(newPassword);

    // Update password and invalidate all sessions
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id));

      await tx
        .delete(sessions)
        .where(eq(sessions.userId, currentUser.id));
    });

    return NextResponse.json({
      success: true,
      message:
        "Password changed successfully. Please log in again with your new password.",
    });
  } catch (error) {
    console.error(
      "Employee change password API error:",
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