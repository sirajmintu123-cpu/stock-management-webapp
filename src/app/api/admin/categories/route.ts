import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

// GET — Admin can view all categories
export async function GET() {
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
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  try {
    const result = await db.select().from(categories);

    return NextResponse.json({
      success: true,
      categories: result,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load categories.",
      },
      { status: 500 },
    );
  }
}

// POST — Create category
export async function POST(request: Request) {
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
        message: "Admin access required.",
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const categoryCode = String(body.categoryCode || "")
      .trim()
      .toUpperCase();
    const description = String(body.description || "").trim();

    if (!name || !categoryCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name and category code are required.",
        },
        { status: 400 },
      );
    }

    // Check duplicate category name
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name already exists.",
        },
        { status: 409 },
      );
    }

    // Check duplicate category code
    const existingCode = await db
      .select()
      .from(categories)
      .where(eq(categories.categoryCode, categoryCode))
      .limit(1);

    if (existingCode.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category code already exists.",
        },
        { status: 409 },
      );
    }

    const result = await db
      .insert(categories)
      .values({
        name,
        categoryCode,
        description: description || null,
      });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully.",
        categoryId: result[0].insertId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create category.",
      },
      { status: 500 },
    );
  }
}