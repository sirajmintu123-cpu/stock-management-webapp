import { NextResponse } from "next/server";

import { logout } from "@/lib/session";

export async function POST() {
  try {
    await logout();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to log out.",
      },
      { status: 500 },
    );
  }
}