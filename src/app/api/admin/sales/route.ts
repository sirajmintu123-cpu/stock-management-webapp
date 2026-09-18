import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  customerEnquiries,
  customers,
  inventoryTransactions,
  products,
  saleItems,
  sales,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

type SaleItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

const PAYMENT_STATUSES = [
  "PENDING",
  "PARTIAL",
  "PAID",
  "CANCELLED",
] as const;

const SALE_SOURCES = ["DIRECT", "ENQUIRY"] as const;

function generateSaleCode() {
  return `SAL-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000,
  )}`;
}

function generateTransactionCode() {
  return `SALE-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000,
  )}`;
}

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

function isValidNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

/*
|--------------------------------------------------------------------------
| GET SALES
|--------------------------------------------------------------------------
| Admin only.
|
| Optional:
| /api/admin/sales
| /api/admin/sales?enquiryId=1
| /api/admin/sales?customerId=1
|--------------------------------------------------------------------------
*/

export async function GET(request: Request) {
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

    const enquiryIdParam = searchParams.get("enquiryId");
    const customerIdParam = searchParams.get("customerId");

    const enquiryId = enquiryIdParam
      ? Number(enquiryIdParam)
      : null;

    const customerId = customerIdParam
      ? Number(customerIdParam)
      : null;

    if (
      enquiryIdParam &&
      (!Number.isInteger(enquiryId) || enquiryId! <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry ID.",
        },
        { status: 400 },
      );
    }

    if (
      customerIdParam &&
      (!Number.isInteger(customerId) || customerId! <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer ID.",
        },
        { status: 400 },
      );
    }

    const conditions = [];

    if (enquiryId) {
      conditions.push(eq(sales.enquiryId, enquiryId));
    }

    if (customerId) {
      conditions.push(eq(sales.customerId, customerId));
    }

    const saleRows = await db
  .select({
    id: sales.id,
    saleCode: sales.saleCode,
    customerId: sales.customerId,
    customerCode: customers.customerCode,
    customerName: customers.name,
    customerMobile: customers.mobile,
    source: sales.source,
    enquiryId: sales.enquiryId,
    saleDate: sales.saleDate,
    totalAmount: sales.totalAmount,
    paymentStatus: sales.paymentStatus,
    remarks: sales.remarks,
    createdByUserId: sales.createdByUserId,
    createdAt: sales.createdAt,
    updatedAt: sales.updatedAt,
  })
  .from(sales)
  .innerJoin(
    customers,
    eq(sales.customerId, customers.id),
  )
  .where(
    conditions.length > 0
      ? and(...conditions)
      : undefined,
  )
  .orderBy(desc(sales.createdAt));

/*
|--------------------------------------------------------------------------
| LOAD SALE ITEMS + STOCK MOVEMENT
|--------------------------------------------------------------------------
*/

const salesWithItems = await Promise.all(
  saleRows.map(async (sale) => {
    const itemRows = await db
      .select({
        saleItemId: saleItems.id,

        productId: saleItems.productId,
        productCode: products.productCode,
        productName: products.name,
        productUnit: products.unit,

        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        lineTotal: saleItems.lineTotal,

        previousBalance:
          inventoryTransactions.previousBalance,

        newBalance:
          inventoryTransactions.newBalance,
      })
      .from(saleItems)
      .innerJoin(
        products,
        eq(saleItems.productId, products.id),
      )
      .leftJoin(
        inventoryTransactions,
        and(
          eq(
            inventoryTransactions.saleItemId,
            saleItems.id,
          ),
          eq(
            inventoryTransactions.saleId,
            sale.id,
          ),
          eq(
            inventoryTransactions.transactionType,
            "SALE",
          ),
        ),
      )
      .where(eq(saleItems.saleId, sale.id));

    return {
      ...sale,
      items: itemRows,
    };
  }),
);

return NextResponse.json({
  success: true,
  sales: salesWithItems,
});

  } catch (error) {
    console.error("Get sales error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load sales.",
      },
      { status: 500 },
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST SALE
|--------------------------------------------------------------------------
| Admin only.
|
| Supports:
|
| 1. DIRECT sale
| 2. ENQUIRY conversion
|
| Everything happens inside one DB transaction.
|--------------------------------------------------------------------------
*/

export async function POST(request: Request) {
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

    const source = String(body.source || "DIRECT").trim();

    if (!SALE_SOURCES.includes(source as (typeof SALE_SOURCES)[number])) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sale source.",
        },
        { status: 400 },
      );
    }

    const customerId = Number(body.customerId);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid customer ID is required.",
        },
        { status: 400 },
      );
    }

    let enquiryId: number | null = null;

    if (source === "ENQUIRY") {
      enquiryId = Number(body.enquiryId);

      if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A valid enquiry ID is required for an enquiry sale.",
          },
          { status: 400 },
        );
      }
    }

    const paymentStatus = String(
      body.paymentStatus || "PENDING",
    ).trim();

    if (
      !PAYMENT_STATUSES.includes(
        paymentStatus as (typeof PAYMENT_STATUSES)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status.",
        },
        { status: 400 },
      );
    }

    if (paymentStatus === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cancelled sales should not be created.",
        },
        { status: 400 },
      );
    }

    const rawItems = body.items;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one sale item is required.",
        },
        { status: 400 },
      );
    }

    const items: SaleItemInput[] = [];

    for (const item of rawItems) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

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

      if (!isPositiveInteger(quantity)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sale quantity must be a positive integer.",
          },
          { status: 400 },
        );
      }

      if (!isValidNumber(unitPrice)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unit price must be a valid non-negative number.",
          },
          { status: 400 },
        );
      }

      items.push({
        productId,
        quantity,
        unitPrice,
      });
    }

    const remarks =
      body.remarks === undefined ||
      body.remarks === null
        ? null
        : String(body.remarks).trim() || null;

    /*
    |--------------------------------------------------------------------------
    | DATABASE TRANSACTION
    |--------------------------------------------------------------------------
    */

    const result = await db.transaction(async (tx) => {
      /*
      |--------------------------------------------------------------------------
      | CUSTOMER CHECK
      |--------------------------------------------------------------------------
      */

      const customerRows = await tx
        .select({
          id: customers.id,
          customerCode: customers.customerCode,
          name: customers.name,
        })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      const customer = customerRows[0];

      if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      /*
      |--------------------------------------------------------------------------
      | ENQUIRY CHECK
      |--------------------------------------------------------------------------
      */

      let enquiry = null;

      if (source === "ENQUIRY" && enquiryId) {
        const enquiryRows = await tx
          .select({
            id: customerEnquiries.id,
            customerId: customerEnquiries.customerId,
            productId: customerEnquiries.productId,
            requiredQuantity:
              customerEnquiries.requiredQuantity,
            status: customerEnquiries.status,
          })
          .from(customerEnquiries)
          .where(eq(customerEnquiries.id, enquiryId))
          .limit(1);

        enquiry = enquiryRows[0];

        if (!enquiry) {
          throw new Error("ENQUIRY_NOT_FOUND");
        }

        if (enquiry.customerId !== customerId) {
          throw new Error("ENQUIRY_CUSTOMER_MISMATCH");
        }

        if (enquiry.status === "CONVERTED") {
          throw new Error("ENQUIRY_ALREADY_CONVERTED");
        }

        if (
          enquiry.status === "CANCELLED" ||
          enquiry.status === "LOST"
        ) {
          throw new Error("ENQUIRY_NOT_CONVERTIBLE");
        }
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE SALE CODE
      |--------------------------------------------------------------------------
      */

      const saleCode = generateSaleCode();

      /*
      |--------------------------------------------------------------------------
      | CALCULATE TOTAL
      |--------------------------------------------------------------------------
      */

      let totalAmount = 0;

      for (const item of items) {
        totalAmount += item.quantity * item.unitPrice;
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE SALE
      |--------------------------------------------------------------------------
      */

      const saleInsert = await tx.insert(sales).values({
        saleCode,
        customerId,
        source: source as "DIRECT" | "ENQUIRY",
        enquiryId,
        totalAmount: totalAmount.toFixed(2),
        paymentStatus: paymentStatus as
          | "PENDING"
          | "PARTIAL"
          | "PAID"
          | "CANCELLED",
        remarks,
        createdByUserId: user.id,
      });

      const saleId = Number(saleInsert[0].insertId);

      /*
      |--------------------------------------------------------------------------
      | PROCESS EACH SALE ITEM
      |--------------------------------------------------------------------------
      */

      const createdItems = [];

      for (const item of items) {
        const productRows = await tx
          .select({
            id: products.id,
            productCode: products.productCode,
            name: products.name,
            unit: products.unit,
            currentStock: products.currentStock,
            isActive: products.isActive,
          })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        const product = productRows[0];

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        if (!product.isActive) {
          throw new Error("PRODUCT_INACTIVE");
        }

        /*
        |--------------------------------------------------------------------------
        | STOCK CHECK
        |--------------------------------------------------------------------------
        */

        if (product.currentStock < item.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK:${product.productCode}:${product.currentStock}:${item.quantity}`,
          );
        }

        const previousBalance = product.currentStock;
        const newBalance =
          previousBalance - item.quantity;

        const lineTotal =
          item.quantity * item.unitPrice;

        /*
        |--------------------------------------------------------------------------
        | CREATE SALE ITEM
        |--------------------------------------------------------------------------
        */

        const saleItemInsert = await tx
          .insert(saleItems)
          .values({
            saleId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            lineTotal: lineTotal.toFixed(2),
          });

        const saleItemId = Number(
          saleItemInsert[0].insertId,
        );

        /*
        |--------------------------------------------------------------------------
        | UPDATE PRODUCT STOCK
        |--------------------------------------------------------------------------
        */

        await tx
          .update(products)
          .set({
            currentStock: newBalance,
          })
          .where(eq(products.id, item.productId));

        /*
        |--------------------------------------------------------------------------
        | INVENTORY LEDGER
        |--------------------------------------------------------------------------
        */

        await tx.insert(inventoryTransactions).values({
          transactionCode: generateTransactionCode(),
          productId: item.productId,
          transactionType: "SALE",
          quantity: -item.quantity,
          previousBalance,
          newBalance,
          saleId,
          saleItemId,
          performedByUserId: user.id,
          remarks:
            remarks || `Sale ${saleCode}`,
        });

        createdItems.push({
          saleItemId,
          productId: product.id,
          productCode: product.productCode,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
          previousBalance,
          newBalance,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | CONVERT ENQUIRY
      |--------------------------------------------------------------------------
      */

      if (source === "ENQUIRY" && enquiryId) {
        await tx
          .update(customerEnquiries)
          .set({
            status: "CONVERTED",
            updatedAt: new Date(),
          })
          .where(eq(customerEnquiries.id, enquiryId));
      }

      return {
        saleId,
        saleCode,
        customer,
        source,
        enquiryId,
        totalAmount,
        paymentStatus,
        items: createdItems,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message:
          source === "ENQUIRY"
            ? "Enquiry converted to sale successfully."
            : "Sale created successfully.",
        sale: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create sale error:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message === "CUSTOMER_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 },
      );
    }

    if (message === "ENQUIRY_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Enquiry not found.",
        },
        { status: 404 },
      );
    }

    if (message === "ENQUIRY_CUSTOMER_MISMATCH") {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected enquiry does not belong to the selected customer.",
        },
        { status: 400 },
      );
    }

    if (message === "ENQUIRY_ALREADY_CONVERTED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This enquiry has already been converted to a sale.",
        },
        { status: 409 },
      );
    }

    if (message === "ENQUIRY_NOT_CONVERTIBLE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This enquiry cannot be converted because its status is LOST or CANCELLED.",
        },
        { status: 400 },
      );
    }

    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "One of the selected products was not found.",
        },
        { status: 404 },
      );
    }

    if (message === "PRODUCT_INACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "One of the selected products is inactive.",
        },
        { status: 400 },
      );
    }

    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      const parts = message.split(":");

      return NextResponse.json(
        {
          success: false,
          message: `Insufficient stock for product ${parts[1]}. Available: ${parts[2]}, Required: ${parts[3]}.`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create sale.",
      },
      { status: 500 },
    );
  }
}