import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  customerEnquiries,
  customers,
  products,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "CONVERTED",
  "LOST",
  "CANCELLED",
] as const;

type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/**
 * GET /api/admin/enquiries
 *
 * Admin only.
 *
 * Optional:
 * /api/admin/enquiries?status=NEW
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();

    if (
      status &&
      !ENQUIRY_STATUSES.includes(status as EnquiryStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry status.",
        },
        { status: 400 },
      );
    }

    const conditions = status
      ? [
          eq(
            customerEnquiries.status,
            status as EnquiryStatus,
          ),
        ]
      : [];

    const enquiries = await db
      .select({
        id: customerEnquiries.id,
        enquiryCode: customerEnquiries.enquiryCode,

        customerId: customers.id,
        customerCode: customers.customerCode,
        customerName: customers.name,
        customerMobile: customers.mobile,

        productId: products.id,
        productCode: products.productCode,
        productName: products.name,
        productUnit: products.unit,
        currentStock: products.currentStock,

        requiredQuantity: customerEnquiries.requiredQuantity,
        expectedPurchaseDate:
          customerEnquiries.expectedPurchaseDate,
        remarks: customerEnquiries.remarks,

        status: customerEnquiries.status,

        submittedByUserId:
          customerEnquiries.submittedByUserId,
        submittedByUserCode: users.userCode,
        submittedByName: users.name,

        createdAt: customerEnquiries.createdAt,
        updatedAt: customerEnquiries.updatedAt,
      })
      .from(customerEnquiries)
      .innerJoin(
        customers,
        eq(customerEnquiries.customerId, customers.id),
      )
      .innerJoin(
        products,
        eq(customerEnquiries.productId, products.id),
      )
      .innerJoin(
        users,
        eq(customerEnquiries.submittedByUserId, users.id),
      )
      .where(and(...conditions))
      .orderBy(desc(customerEnquiries.createdAt));

    return NextResponse.json({
      success: true,
      enquiries,
    });
  } catch (error) {
    console.error("Admin enquiry GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load enquiries.",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/enquiries
 *
 * Admin only.
 *
 * Body:
 * {
 *   enquiryId: 1,
 *   status: "CONTACTED"
 * }
 *
 * This endpoint only changes the enquiry status.
 * It does NOT create a sale.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
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

    const body = await request.json();

    const enquiryId = Number(body.enquiryId);
    const status = String(body.status || "").trim();

    if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid enquiry ID is required.",
        },
        { status: 400 },
      );
    }

    if (!ENQUIRY_STATUSES.includes(status as EnquiryStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry status.",
        },
        { status: 400 },
      );
    }

    const existing = await db
      .select({
        id: customerEnquiries.id,
        enquiryCode: customerEnquiries.enquiryCode,
        status: customerEnquiries.status,
      })
      .from(customerEnquiries)
      .where(eq(customerEnquiries.id, enquiryId))
      .limit(1);

    const enquiry = existing[0];

    if (!enquiry) {
      return NextResponse.json(
        {
          success: false,
          message: "Enquiry not found.",
        },
        { status: 404 },
      );
    }

    // Do not allow an already converted enquiry
    // to be moved back to another status.
    if (
      enquiry.status === "CONVERTED" &&
      status !== "CONVERTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A converted enquiry cannot be moved back to another status.",
        },
        { status: 400 },
      );
    }

    await db
      .update(customerEnquiries)
      .set({
        status: status as EnquiryStatus,
        updatedAt: new Date(),
      })
      .where(eq(customerEnquiries.id, enquiryId));

    return NextResponse.json({
      success: true,
      message: "Enquiry status updated successfully.",
      enquiry: {
        id: enquiry.id,
        enquiryCode: enquiry.enquiryCode,
        previousStatus: enquiry.status,
        status,
      },
    });
  } catch (error) {
    console.error("Admin enquiry PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update enquiry status.",
      },
      { status: 500 },
    );
  }
}