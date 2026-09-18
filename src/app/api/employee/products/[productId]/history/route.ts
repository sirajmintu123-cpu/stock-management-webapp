import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  inventoryTransactions,
  products,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ productId: string }>;
  },
) {
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

    if (
      user.role !== "EMPLOYEE" &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 },
      );
    }

    const { productId } = await context.params;

    const parsedProductId = Number(productId);

    if (
      !Number.isInteger(parsedProductId) ||
      parsedProductId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    // Verify that the product exists and is active.
    const productResult = await db
      .select({
        id: products.id,
        productCode: products.productCode,
        name: products.name,
        currentStock: products.currentStock,
      })
      .from(products)
      .where(
        and(
          eq(products.id, parsedProductId),
          eq(products.isActive, true),
        ),
      )
      .limit(1);

    const product = productResult[0];

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }

    // Stock history is read-only for employees.
    const history = await db
      .select({
        id: inventoryTransactions.id,
        transactionCode:
          inventoryTransactions.transactionCode,
        transactionType:
          inventoryTransactions.transactionType,
        quantity:
          inventoryTransactions.quantity,
        previousBalance:
          inventoryTransactions.previousBalance,
        newBalance:
          inventoryTransactions.newBalance,
        remarks:
          inventoryTransactions.remarks,
        createdAt:
          inventoryTransactions.createdAt,
      })
      .from(inventoryTransactions)
      .where(
        eq(
          inventoryTransactions.productId,
          parsedProductId,
        ),
      )
      .orderBy(
        asc(inventoryTransactions.createdAt),
        asc(inventoryTransactions.id),
      );

    return NextResponse.json({
      success: true,

      product,

      history,
    });
  } catch (error) {
    console.error(
      "Employee product history API error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load stock history.",
      },
      { status: 500 },
    );
  }
}