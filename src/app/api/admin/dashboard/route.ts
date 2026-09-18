import { NextResponse } from "next/server";
import { and, count, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  products,
  customers,
  customerEnquiries,
  sales,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    // ---------------------------------------------------------
    // 1. Authentication
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 2. Admin-only access
    // ---------------------------------------------------------
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Admin access required.",
        },
        { status: 403 },
      );
    }

    // ---------------------------------------------------------
    // 3. Get dashboard statistics
    // ---------------------------------------------------------

    // Active products
    const productResult = await db
      .select({
        count: count(),
      })
      .from(products)
      .where(eq(products.isActive, true));

    // Low-stock products
    // A product is considered low stock when:
    // currentStock <= minimumStockLevel
    const lowStockResult = await db
      .select({
        count: count(),
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          lte(products.currentStock, products.minimumStockLevel),
        ),
      );

    // Active customers
    const customerResult = await db
      .select({
        count: count(),
      })
      .from(customers)
      .where(eq(customers.isActive, true));

    // Total enquiries
    const enquiryResult = await db
      .select({
        count: count(),
      })
      .from(customerEnquiries);

    // Total sales excluding cancelled sales
    const salesResult = await db
      .select({
        count: count(),
      })
      .from(sales)
      .where(eq(sales.paymentStatus, "PAID"));

    // ---------------------------------------------------------
    // 4. Return dashboard data
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      dashboard: {
        totalProducts: productResult[0]?.count ?? 0,
        lowStockProducts: lowStockResult[0]?.count ?? 0,
        totalCustomers: customerResult[0]?.count ?? 0,
        totalEnquiries: enquiryResult[0]?.count ?? 0,
        totalSales: salesResult[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard data.",
      },
      { status: 500 },
    );
  }
}