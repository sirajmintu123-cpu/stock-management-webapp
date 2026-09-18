import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  customerEnquiries,
  customers,
  products,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "CONVERTED"
  | "LOST"
  | "CANCELLED";

function generateEnquiryCode() {
  return `ENQ-${Date.now()}-${Math.floor(
    Math.random() * 10000,
  )}`;
}

// GET — View enquiries
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

  try {
    const { searchParams } = new URL(request.url);

    const status = String(
      searchParams.get("status") || "",
    ).trim();

    const conditions = [];

    /*
     * Employee:
     * Can see ONLY enquiries submitted by themselves.
     */
    if (user.role === "EMPLOYEE") {
      conditions.push(
        eq(
          customerEnquiries.submittedByUserId,
          user.id,
        ),
      );
    }

    /*
     * Admin:
     * Can see all enquiries.
     *
     * Optional status filter applies to both
     * Admin and Employee requests.
     */
    if (status) {
      const allowedStatuses: EnquiryStatus[] = [
        "NEW",
        "CONTACTED",
        "FOLLOW_UP",
        "CONVERTED",
        "LOST",
        "CANCELLED",
      ];

      if (!allowedStatuses.includes(
        status as EnquiryStatus,
      )) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid enquiry status.",
          },
          { status: 400 },
        );
      }

      conditions.push(
        eq(
          customerEnquiries.status,
          status as EnquiryStatus,
        ),
      );
    }

    const result = await db
      .select({
        id: customerEnquiries.id,

        enquiryCode:
          customerEnquiries.enquiryCode,

        customerId:
          customerEnquiries.customerId,

        customerName:
          customers.name,

        customerMobile:
          customers.mobile,

        productId:
          customerEnquiries.productId,

        productCode:
          products.productCode,

        productName:
          products.name,

        productUnit:
          products.unit,

        requiredQuantity:
          customerEnquiries.requiredQuantity,

        expectedPurchaseDate:
          customerEnquiries.expectedPurchaseDate,

        remarks:
          customerEnquiries.remarks,

        status:
          customerEnquiries.status,

        submittedByUserId:
          customerEnquiries.submittedByUserId,

        createdAt:
          customerEnquiries.createdAt,

        updatedAt:
          customerEnquiries.updatedAt,
      })
      .from(customerEnquiries)
      .innerJoin(
        customers,
        eq(
          customerEnquiries.customerId,
          customers.id,
        ),
      )
      .innerJoin(
        products,
        eq(
          customerEnquiries.productId,
          products.id,
        ),
      )
      .where(
        conditions.length > 0
          ? and(...conditions)
          : undefined,
      )
      .orderBy(
        desc(customerEnquiries.createdAt),
      );

    return NextResponse.json({
      success: true,
      enquiries: result,
    });
  } catch (error) {
    console.error(
      "Get enquiries error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load customer enquiries.",
      },
      { status: 500 },
    );
  }
}

// POST — Create customer enquiry
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

  /*
   * Both Admin and Employee can create
   * customer enquiries.
   */
  if (
    user.role !== "ADMIN" &&
    user.role !== "EMPLOYEE"
  ) {
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

    const customerId = Number(
      body.customerId,
    );

    const productId = Number(
      body.productId,
    );

    const requiredQuantity = Number(
      body.requiredQuantity,
    );

    const expectedPurchaseDateText =
      String(
        body.expectedPurchaseDate || "",
      ).trim();

    const remarks = String(
      body.remarks || "",
    ).trim();

    // -----------------------------
    // Validate customer
    // -----------------------------

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid customer is required.",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Validate product
    // -----------------------------

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid product is required.",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Validate quantity
    // -----------------------------

    if (
      !Number.isInteger(
        requiredQuantity,
      ) ||
      requiredQuantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Required quantity must be a positive whole number.",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Validate expected date
    // -----------------------------

    let expectedPurchaseDate:
      Date | null = null;

    if (expectedPurchaseDateText) {
      const parsedDate = new Date(
        expectedPurchaseDateText,
      );

      if (
        Number.isNaN(
          parsedDate.getTime(),
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid expected purchase date.",
          },
          { status: 400 },
        );
      }

      expectedPurchaseDate =
        parsedDate;
    }

    // -----------------------------
    // Check customer
    // -----------------------------

    const customerResult = await db
      .select({
        id: customers.id,
        name: customers.name,
        isActive:
          customers.isActive,
      })
      .from(customers)
      .where(
        eq(
          customers.id,
          customerId,
        ),
      )
      .limit(1);

    const customer =
      customerResult[0];

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 },
      );
    }

    if (!customer.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This customer is inactive.",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Check product
    // -----------------------------

    const productResult = await db
      .select({
        id: products.id,
        productCode:
          products.productCode,
        name: products.name,
        unit: products.unit,
        currentStock:
          products.currentStock,
        isActive:
          products.isActive,
      })
      .from(products)
      .where(
        eq(
          products.id,
          productId,
        ),
      )
      .limit(1);

    const product =
      productResult[0];

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This product is inactive.",
        },
        { status: 400 },
      );
    }

    /*
     * IMPORTANT:
     *
     * We DO NOT check whether the requested
     * quantity is currently available.
     *
     * An enquiry is only a customer request.
     *
     * Stock is NOT changed here.
     */

    const enquiryCode =
      generateEnquiryCode();

    const result = await db
      .insert(customerEnquiries)
      .values({
        enquiryCode,

        customerId,

        productId,

        requiredQuantity,

        expectedPurchaseDate,

        remarks:
          remarks || null,

        status: "NEW",

        submittedByUserId:
          user.id,
      });

    const enquiryId = Number(
      result[0].insertId,
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Customer enquiry submitted successfully.",

        enquiry: {
          id: enquiryId,

          enquiryCode,

          customerId,

          customerName:
            customer.name,

          productId,

          productCode:
            product.productCode,

          productName:
            product.name,

          productUnit:
            product.unit,

          requiredQuantity,

          expectedPurchaseDate,

          remarks:
            remarks || null,

          status: "NEW",

          submittedByUserId:
            user.id,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create enquiry error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create customer enquiry.",
      },
      { status: 500 },
    );
  }
}