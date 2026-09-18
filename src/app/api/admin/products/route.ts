import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  inventoryTransactions,
  products,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

// GET — Admin can view all products
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
    const result = await db
      .select({
        id: products.id,
        productCode: products.productCode,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        unit: products.unit,
        sellingPrice: products.sellingPrice,
        currentStock: products.currentStock,
        minimumStockLevel: products.minimumStockLevel,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(
        categories,
        eq(products.categoryId, categories.id),
      );

    return NextResponse.json({
      success: true,
      products: result,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load products.",
      },
      { status: 500 },
    );
  }
}

// POST — Create product
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

    const productCode = String(body.productCode || "")
      .trim()
      .toUpperCase();

    const name = String(body.name || "").trim();

    const categoryId = Number(body.categoryId);

    const unit = String(body.unit || "").trim();

    const sellingPrice = Number(body.sellingPrice);

    const minimumStockLevel = Number(body.minimumStockLevel);

    const openingStock = Number(body.openingStock);

    const remarks = String(body.remarks || "").trim();

    // Basic validation
    if (!productCode || !name || !categoryId || !unit) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Product code, name, category and unit are required.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Selling price must be a valid number.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(minimumStockLevel) ||
      minimumStockLevel < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Minimum stock level must be a valid non-negative number.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(openingStock) ||
      openingStock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Opening stock must be a valid non-negative number.",
        },
        { status: 400 },
      );
    }

    // Check category
    const categoryResult = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    const category = categoryResult[0];

    if (!category || !category.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected category does not exist or is inactive.",
        },
        { status: 400 },
      );
    }

    // Check duplicate product code
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.productCode, productCode))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product code already exists.",
        },
        { status: 409 },
      );
    }

    // Create product
    const productResult = await db
      .insert(products)
      .values({
        productCode,
        name,
        categoryId,
        unit,
        sellingPrice: sellingPrice.toFixed(2),
        currentStock: openingStock,
        minimumStockLevel,
      });

    const productId = Number(productResult[0].insertId);

    // Create opening stock transaction
    if (openingStock > 0) {
      await db.insert(inventoryTransactions).values({
  productId,
  transactionCode: `OPEN-${productId}-${Date.now()}`,
  transactionType: "OPENING",
  quantity: openingStock,
  previousBalance: 0,
  newBalance: openingStock,
  performedByUserId: user.id,
  remarks: remarks || "Opening stock",
});
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully.",
        productId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create product error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create product.",
      },
      { status: 500 },
    );
  }
}