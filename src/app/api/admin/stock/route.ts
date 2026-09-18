import { NextResponse } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  inventoryTransactions,
  products,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

type StockTransactionType =
  | "PURCHASE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

function generateTransactionCode() {
  return `STK-${Date.now()}-${Math.floor(
    Math.random() * 10000,
  )}`;
}

// GET — View stock and stock history
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

    const productIdParam = searchParams.get("productId");

    // If productId is supplied, return its stock history
    if (productIdParam) {
      const productId = Number(productIdParam);

      if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product ID.",
          },
          { status: 400 },
        );
      }

      const productResult = await db
        .select({
          id: products.id,
          productCode: products.productCode,
          name: products.name,
          unit: products.unit,
          currentStock: products.currentStock,
          minimumStockLevel: products.minimumStockLevel,
          isActive: products.isActive,
        })
        .from(products)
        .where(eq(products.id, productId))
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

      const history = await db
        .select()
        .from(inventoryTransactions)
        .where(
          eq(
            inventoryTransactions.productId,
            productId,
          ),
        )
        .orderBy(
          desc(inventoryTransactions.createdAt),
        );

      return NextResponse.json({
        success: true,
        product,
        history,
      });
    }

    // Otherwise return stock overview
    const stock = await db
      .select({
        id: products.id,
        productCode: products.productCode,
        name: products.name,
        unit: products.unit,
        currentStock: products.currentStock,
        minimumStockLevel: products.minimumStockLevel,
        isActive: products.isActive,
      })
      .from(products)
      .orderBy(products.name);

    return NextResponse.json({
      success: true,
      stock,
    });
  } catch (error) {
    console.error("Get stock error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load stock information.",
      },
      { status: 500 },
    );
  }
}

// POST — Add stock / adjust stock
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

    const productId = Number(body.productId);
    const quantity = Number(body.quantity);
    const transactionType =
      String(body.transactionType || "").trim() as StockTransactionType;
    const remarks = String(body.remarks || "").trim();

    // Validation
    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid product is required.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quantity must be a positive whole number.",
        },
        { status: 400 },
      );
    }

    const allowedTypes: StockTransactionType[] = [
      "PURCHASE",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
    ];

    if (!allowedTypes.includes(transactionType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid stock transaction type.",
        },
        { status: 400 },
      );
    }

    if (!remarks) {
      return NextResponse.json(
        {
          success: false,
          message: "Remarks are required for stock movement.",
        },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const productResult = await tx
        .select({
          id: products.id,
          productCode: products.productCode,
          name: products.name,
          currentStock: products.currentStock,
          isActive: products.isActive,
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      const product = productResult[0];

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (!product.isActive) {
        throw new Error("PRODUCT_INACTIVE");
      }

      const previousBalance = product.currentStock;

      let newBalance: number;

      if (
        transactionType === "PURCHASE" ||
        transactionType === "ADJUSTMENT_IN"
      ) {
        newBalance =
          previousBalance + quantity;
      } else {
        newBalance =
          previousBalance - quantity;

        if (newBalance < 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const updateResult = await tx
        .update(products)
        .set({
          currentStock: newBalance,
        })
        .where(
          and(
            eq(products.id, productId),
            gte(products.currentStock, 0),
          ),
        );

      if (updateResult[0].affectedRows !== 1) {
        throw new Error("STOCK_UPDATE_FAILED");
      }

      const transactionCode =
        generateTransactionCode();

      await tx
        .insert(inventoryTransactions)
        .values({
          transactionCode,
          productId,
          transactionType,
          quantity,
          previousBalance,
          newBalance,
          performedByUserId: user.id,
          remarks,
        });

      return {
        productId,
        transactionCode,
        transactionType,
        quantity,
        previousBalance,
        newBalance,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Stock updated successfully.",
        transaction: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Stock update error:", error);

    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Product not found.",
          },
          { status: 404 },
        );
      }

      if (error.message === "PRODUCT_INACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message: "This product is inactive.",
          },
          { status: 400 },
        );
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Insufficient stock. Stock cannot become negative.",
          },
          { status: 400 },
        );
      }

      if (error.message === "STOCK_UPDATE_FAILED") {
        return NextResponse.json(
          {
            success: false,
            message: "Unable to update stock.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process stock movement.",
      },
      { status: 500 },
    );
  }
}