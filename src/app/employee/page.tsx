import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  products,
  customerEnquiries,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "./LogoutButton";

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "EMPLOYEE") {
    redirect("/admin");
  }

  // ---------------------------------------------------------
  // Total active products + available stock
  // ---------------------------------------------------------

  const productResult = await db
    .select({
      totalProducts: sql<number>`COUNT(*)`,
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
      totalLowStock: sql<number>`COUNT(*)`,
    })
    .from(products)
    .where(
      sql`
        ${products.isActive} = true
        AND ${products.currentStock} <= ${products.minimumStockLevel}
      `,
    );

  // ---------------------------------------------------------
  // Employee's own enquiries
  // ---------------------------------------------------------

  const enquiryResult = await db
    .select({
      totalEnquiries: sql<number>`COUNT(*)`,
    })
    .from(customerEnquiries)
    .where(
      eq(
        customerEnquiries.submittedByUserId,
        user.id,
      ),
    );

  const totalProducts = Number(
    productResult[0]?.totalProducts ?? 0,
  );

  const totalStock = Number(
    productResult[0]?.totalStock ?? 0,
  );

  const myEnquiries = Number(
    enquiryResult[0]?.totalEnquiries ?? 0,
  );

  const lowStockProducts = Number(
    lowStockResult[0]?.totalLowStock ?? 0,
  );

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">

          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Employee Dashboard
              </h1>

              <p className="mt-2 text-gray-600">
                Welcome, {user.name}
              </p>
            </div>

            <LogoutButton />
          </div>

          {/* Dashboard Cards */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* Products */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                Products
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalProducts}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Active products
              </p>
            </div>

            {/* Available Stock */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                Available Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalStock}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Total available quantity
              </p>
            </div>

            {/* My Enquiries */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                My Enquiries
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {myEnquiries}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Enquiries submitted by you
              </p>
            </div>

            {/* Low Stock */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                Low Stock
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${
                  lowStockProducts > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {lowStockProducts}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Products needing attention
              </p>
            </div>

          </div>

          {/* Quick Access */}
          <div className="mt-10">

            <h2 className="text-lg font-semibold text-gray-900">
              Quick Access
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <a
                href="/employee/enquiries"
                className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
              >
                <p className="font-semibold text-gray-900">
                  Customer Enquiries
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Create and track your customer enquiries
                </p>
              </a>

              <a
                href="/employee/products"
                className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
              >
                <p className="font-semibold text-gray-900">
                  Search Products
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Browse products, prices and available stock
                </p>
              </a>

              <a
                href="/employee/products"
                className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
              >
                <p className="font-semibold text-gray-900">
                  Stock Information
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  View product-wise stock movements
                </p>
              </a>

              <Link
  href="/employee/profile"
  className="..."
>
  <div>
    <h3 className="font-semibold text-slate-900">
      My Profile
    </h3>

    <p className="mt-1 text-sm text-slate-500">
      View your employee account information
    </p>
  </div>

  <span className="mt-4 inline-block text-sm font-semibold text-blue-600">
    View Profile →
  </span>
</Link>

            </div>
          </div>

          {/* Permission Notice */}
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="font-semibold text-blue-900">
              Employee Access
            </p>

            <p className="mt-1 text-sm text-blue-700">
              You can view products, check stock availability,
              and submit customer enquiries. Stock changes and
              sales are managed by Admin only.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}