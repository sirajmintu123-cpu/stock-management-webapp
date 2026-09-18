import { NextResponse } from "next/server";
import { and, count, eq, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  products,
  customerEnquiries,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
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

    if (user.role !== "EMPLOYEE") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Employee access required.",
        },
        { status: 403 },
      );
    }

    // ---------------------------------------------------------
    // Total active products
    // ---------------------------------------------------------

    const productResult = await db
      .select({
        count: count(),
      })
      .from(products)
      .where(eq(products.isActive, true));

    // ---------------------------------------------------------
    // Total available stock
    // ---------------------------------------------------------

    const stockResult = await db
      .select({
        totalStock: sql<number>`
          COALESCE(SUM(${products.currentStock}), 0)
        `,
      })
      .from(products)
      .where(eq(products.isActive, true));

    // ---------------------------------------------------------
    // Low stock products
    // ---------------------------------------------------------

    const lowStockResult = await db
      .select({
        count: count(),
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          lte(
            products.currentStock,
            products.minimumStockLevel,
          ),
        ),
      );

    // ---------------------------------------------------------
    // Employee's own enquiries
    // ---------------------------------------------------------

    const enquiryResult = await db
      .select({
        count: count(),
      })
      .from(customerEnquiries)
      .where(
        eq(
          customerEnquiries.submittedByUserId,
          user.id,
        ),
      );

    // ---------------------------------------------------------
    // Response
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,

      dashboard: {
        totalProducts:
          productResult[0]?.count ?? 0,

        totalStock:
          Number(stockResult[0]?.totalStock ?? 0),

        lowStockProducts:
          lowStockResult[0]?.count ?? 0,

        myEnquiries:
          enquiryResult[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error(
      "Employee dashboard API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load employee dashboard data.",
      },
      { status: 500 },
    );
  }
}