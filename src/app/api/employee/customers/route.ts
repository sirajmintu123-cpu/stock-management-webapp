import { NextResponse } from "next/server";
import { and, asc, desc, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

function generateCustomerCode(lastCode: string | null) {
  if (!lastCode) {
    return "CUS001";
  }

  const match = lastCode.match(/^CUS(\d+)$/i);

  if (!match) {
    return "CUS001";
  }

  const nextNumber = Number(match[1]) + 1;

  return `CUS${String(nextNumber).padStart(3, "0")}`;
}

// GET — View active customers
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

  if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "Access denied.",
      },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const conditions = [eq(customers.isActive, true)];

    if (search) {
      conditions.push(
        or(
          like(customers.customerCode, `%${search}%`),
          like(customers.name, `%${search}%`),
          like(customers.mobile, `%${search}%`),
        )!,
      );
    }

    const result = await db
      .select({
        id: customers.id,
        customerCode: customers.customerCode,
        name: customers.name,
        mobile: customers.mobile,
        email: customers.email,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(asc(customers.name));

    return NextResponse.json({
      success: true,
      customers: result,
    });
  } catch (error) {
    console.error("Employee customers GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load customers.",
      },
      { status: 500 },
    );
  }
}

// POST — Create a new customer
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

  if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "Access denied.",
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const mobile = String(body.mobile || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const remarks = String(body.remarks || "").trim();

    // Basic validation
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required.",
        },
        { status: 400 },
      );
    }

    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number is required.",
        },
        { status: 400 },
      );
    }

    // Basic Indian mobile validation
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 },
      );
    }

    // Optional email validation
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    // Check whether this mobile already exists
    const existingCustomer = await db
      .select({
        id: customers.id,
        customerCode: customers.customerCode,
        name: customers.name,
        mobile: customers.mobile,
        isActive: customers.isActive,
      })
      .from(customers)
      .where(eq(customers.mobile, mobile))
      .limit(1);

    if (existingCustomer.length > 0) {
      const existing = existingCustomer[0];

      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          message:
            "A customer with this mobile number already exists.",
          customer: existing,
        },
        { status: 409 },
      );
    }

    // Find the latest customer code
    const latestCustomer = await db
      .select({
        customerCode: customers.customerCode,
      })
      .from(customers)
      .orderBy(desc(customers.customerCode))
      .limit(1);

    const lastCode =
      latestCustomer[0]?.customerCode || null;

    const customerCode = generateCustomerCode(lastCode);

    // Create customer
    const result = await db.insert(customers).values({
      customerCode,
      name,
      mobile,
      email: email || null,
      address: address || null,
      remarks: remarks || null,
      isActive: true,
    });

    const customerId = Number(result[0].insertId);

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully.",
        customer: {
          id: customerId,
          customerCode,
          name,
          mobile,
          email: email || null,
          address: address || null,
          remarks: remarks || null,
          isActive: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Employee customers POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create customer.",
      },
      { status: 500 },
    );
  }
}