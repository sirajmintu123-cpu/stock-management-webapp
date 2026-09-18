import { NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  inventoryTransactions,
  products,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

// =========================================================
// GET — Admin can view all products
// =========================================================

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


// =========================================================
// POST — Create product
// =========================================================

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

    const minimumStockLevel = Number(
      body.minimumStockLevel,
    );

    const openingStock = Number(body.openingStock);

    const remarks = String(body.remarks || "").trim();


    // -------------------------------------------------------
    // Basic validation
    // -------------------------------------------------------

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
          message:
            "Selling price must be a valid number.",
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


    // -------------------------------------------------------
    // Check category
    // -------------------------------------------------------

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
          message:
            "Selected category does not exist or is inactive.",
        },
        { status: 400 },
      );
    }


    // -------------------------------------------------------
    // Check duplicate product code
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // Create product
    // -------------------------------------------------------

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

    const productId = Number(
      productResult[0].insertId,
    );


    // -------------------------------------------------------
    // Create opening stock transaction
    // -------------------------------------------------------

    if (openingStock > 0) {
      await db
        .insert(inventoryTransactions)
        .values({
          productId,
          transactionCode:
            `OPEN-${productId}-${Date.now()}`,
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
    console.error(
      "Create product error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create product.",
      },
      { status: 500 },
    );
  }
}


// =========================================================
// PATCH — Edit product
//
// IMPORTANT:
// Stock is intentionally NOT changed here.
// Stock must be controlled by inventory transactions/sales.
// =========================================================

export async function PATCH(request: Request) {
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

    const productId = Number(body.id);

    const productCode = String(
      body.productCode || "",
    )
      .trim()
      .toUpperCase();

    const name = String(body.name || "").trim();

    const categoryId = Number(body.categoryId);

    const unit = String(body.unit || "").trim();

    const sellingPrice = Number(
      body.sellingPrice,
    );

    const minimumStockLevel = Number(
      body.minimumStockLevel,
    );


    // -------------------------------------------------------
    // Basic validation
    // -------------------------------------------------------

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }

    if (
      !productCode ||
      !name ||
      !categoryId ||
      !unit
    ) {
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
          message:
            "Selling price must be a valid number.",
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


    // -------------------------------------------------------
    // Check product exists
    // -------------------------------------------------------

    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }


    // -------------------------------------------------------
    // Check category
    // -------------------------------------------------------

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
          message:
            "Selected category does not exist or is inactive.",
        },
        { status: 400 },
      );
    }


    // -------------------------------------------------------
    // Check duplicate product code
    // Exclude the current product itself.
    // -------------------------------------------------------

    const duplicateCode = await db
      .select()
      .from(products)
      .where(
        and(
          eq(
            products.productCode,
            productCode,
          ),
          ne(products.id, productId),
        ),
      )
      .limit(1);

    if (duplicateCode.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another product already uses this product code.",
        },
        { status: 409 },
      );
    }


    // -------------------------------------------------------
    // Update product
    //
    // currentStock is intentionally excluded.
    // -------------------------------------------------------

    await db
      .update(products)
      .set({
        productCode,
        name,
        categoryId,
        unit,
        sellingPrice:
          sellingPrice.toFixed(2),
        minimumStockLevel,
      })
      .where(eq(products.id, productId));


    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
    });

  } catch (error) {
    console.error(
      "Update product error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update product.",
      },
      { status: 500 },
    );
  }
}


// =========================================================
// DELETE — Deactivate product
//
// IMPORTANT:
// This does NOT physically delete the database record.
// Historical inventory/sales references remain safe.
// =========================================================

export async function DELETE(
  request: Request,
) {
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

    const productId = Number(body.id);


    // -------------------------------------------------------
    // Validate product ID
    // -------------------------------------------------------

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 },
      );
    }


    // -------------------------------------------------------
    // Check product exists
    // -------------------------------------------------------

    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 },
      );
    }


    // -------------------------------------------------------
    // Prevent deactivating an already inactive product
    // -------------------------------------------------------

    if (!existingProduct[0].isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is already inactive.",
        },
        { status: 400 },
      );
    }


    // -------------------------------------------------------
    // Deactivate product
    // -------------------------------------------------------

    await db
      .update(products)
      .set({
        isActive: false,
      })
      .where(eq(products.id, productId));


    return NextResponse.json({
      success: true,
      message: "Product deactivated successfully.",
    });

  } catch (error) {
    console.error(
      "Deactivate product error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to deactivate product.",
      },
      { status: 500 },
    );
  }
}