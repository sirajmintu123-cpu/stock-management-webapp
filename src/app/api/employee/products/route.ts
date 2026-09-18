import { NextResponse } from "next/server";
import { and, asc, eq, like, or } from "drizzle-orm";

import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

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

    const conditions = [eq(products.isActive, true)];

    if (search) {
      conditions.push(
        or(
          like(products.productCode, `%${search}%`),
          like(products.name, `%${search}%`),
        )!,
      );
    }

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
      })
      .from(products)
      .leftJoin(
        categories,
        eq(products.categoryId, categories.id),
      )
      .where(and(...conditions))
      .orderBy(asc(products.name));

    return NextResponse.json({
      success: true,
      products: result,
    });
  } catch (error) {
    console.error("Employee products error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load products.",
      },
      { status: 500 },
    );
  }
}