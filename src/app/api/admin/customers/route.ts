import { NextResponse } from "next/server";
import { asc, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

// GET — Admin can view/search all customers
export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);

    const search = String(
      searchParams.get("search") || "",
    ).trim();

    let result;

    if (search) {
      const keyword = `%${search}%`;

      result = await db
        .select()
        .from(customers)
        .where(
          or(
            like(customers.customerCode, keyword),
            like(customers.name, keyword),
            like(customers.mobile, keyword),
            like(customers.email, keyword),
          ),
        )
        .orderBy(asc(customers.name));
    } else {
      result = await db
        .select()
        .from(customers)
        .orderBy(asc(customers.name));
    }

    return NextResponse.json({
      success: true,
      customers: result,
    });
  } catch (error) {
    console.error(
      "Get customers error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load customers.",
      },
      { status: 500 },
    );
  }
}

// POST — Create customer
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

    const customerCode = String(
      body.customerCode || "",
    )
      .trim()
      .toUpperCase();

    const name = String(
      body.name || "",
    ).trim();

    const mobile = String(
      body.mobile || "",
    ).trim();

    const email = String(
      body.email || "",
    ).trim();

    const address = String(
      body.address || "",
    ).trim();

    const remarks = String(
      body.remarks || "",
    ).trim();

    // Required fields
    if (!customerCode || !name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer code and customer name are required.",
        },
        { status: 400 },
      );
    }

    // Basic email validation
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    // Check duplicate customer code
    const existing = await db
      .select({
        id: customers.id,
      })
      .from(customers)
      .where(
        eq(
          customers.customerCode,
          customerCode,
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Customer code already exists.",
        },
        { status: 409 },
      );
    }

    // Create customer
    const result = await db
      .insert(customers)
      .values({
        customerCode,
        name,
        mobile: mobile || null,
        email: email || null,
        address: address || null,
        remarks: remarks || null,
      });

    const customerId = Number(
      result[0].insertId,
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Customer created successfully.",
        customerId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create customer error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create customer.",
      },
      { status: 500 },
    );
  }
}