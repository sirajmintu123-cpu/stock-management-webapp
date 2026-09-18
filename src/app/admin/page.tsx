import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import AdminActions from "./AdminActions";

import { db } from "@/db";
import {
  products,
  customerEnquiries,
  customers,
  users,
  sales,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/employee");
  }

  // ---------------------------------------------------------
  // Dashboard statistics
  // ---------------------------------------------------------

  const productResult = await db
    .select({
      totalProducts: sql<number>`COUNT(*)`,
      totalStock: sql<number>`COALESCE(SUM(${products.currentStock}), 0)`,
    })
    .from(products)
    .where(eq(products.isActive, true));

  const enquiryResult = await db
    .select({
      totalEnquiries: sql<number>`COUNT(*)`,
    })
    .from(customerEnquiries);

  const salesResult = await db
  .select({
    totalSales: sql<number>`COUNT(*)`,
  })
  .from(sales)
  .where(eq(sales.paymentStatus, "PAID"));

  const totalProducts = Number(productResult[0]?.totalProducts ?? 0);
  const totalStock = Number(productResult[0]?.totalStock ?? 0);
  const totalEnquiries = Number(
    enquiryResult[0]?.totalEnquiries ?? 0,
  );
  const totalSales = Number(salesResult[0]?.totalSales ?? 0);

  // ---------------------------------------------------------
  // Recent enquiries
  // ---------------------------------------------------------
// ---------------------------------------------------------
// Low stock products
// ---------------------------------------------------------

const lowStockProducts = await db
  .select({
    id: products.id,
    productCode: products.productCode,
    name: products.name,
    unit: products.unit,
    currentStock: products.currentStock,
    minimumStockLevel: products.minimumStockLevel,
  })
  .from(products)
  .where(
    sql`${products.isActive} = true
      AND ${products.currentStock} <= ${products.minimumStockLevel}`,
  )
  .orderBy(products.currentStock)
  .limit(10);

  const recentEnquiries = await db
    .select({
      id: customerEnquiries.id,
      enquiryCode: customerEnquiries.enquiryCode,
      customerName: customers.name,
      customerMobile: customers.mobile,
      productName: products.name,
      requiredQuantity: customerEnquiries.requiredQuantity,
      status: customerEnquiries.status,
      submittedByName: users.name,
      createdAt: customerEnquiries.createdAt,
    })
    .from(customerEnquiries)
    .innerJoin(
      customers,
      eq(customerEnquiries.customerId, customers.id),
    )
    .innerJoin(
      products,
      eq(customerEnquiries.productId, products.id),
    )
    .innerJoin(
      users,
      eq(customerEnquiries.submittedByUserId, users.id),
    )
    .orderBy(desc(customerEnquiries.createdAt))
    .limit(5);

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
      Admin Dashboard
    </h1>

    <p className="mt-2 text-gray-600">
      Welcome, {user.name}
    </p>
  </div>

  <div className="flex flex-wrap gap-3">
    <Link
      href="/admin/profile"
      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      ⚙ Profile / Password
    </Link>

    <AdminActions />
  </div>
</div>
          {/* Dashboard Cards */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

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

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                Current Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalStock}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Total available quantity
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                Enquiries
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalEnquiries}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Customer enquiries
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-500">
                Sales
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalSales}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Paid sales
              </p>
            </div>
          </div>

         {/* Quick Access */}
<div className="mt-8">
  <h2 className="text-lg font-semibold text-gray-900">
    Quick Access
  </h2>

  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

    <Link
      href="/admin/products"
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
    >
      <p className="font-semibold text-gray-900">
        Products
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Manage products and pricing
      </p>
    </Link>

    <Link
      href="/admin/stock"
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
    >
      <p className="font-semibold text-gray-900">
        Stock Management
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Add stock and view stock history
      </p>
    </Link>

    <Link
      href="/admin/enquiries"
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
    >
      <p className="font-semibold text-gray-900">
        Enquiries
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Manage customer enquiries
      </p>
    </Link>

    <Link
      href="/admin/sales"
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
    >
      <p className="font-semibold text-gray-900">
        Sales
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Record and manage sales
      </p>
    </Link>

    <Link
      href="/admin/employees"
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-400 hover:shadow-md"
    >
      <p className="font-semibold text-gray-900">
        Employee Management
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Add and manage employee accounts and access
      </p>
    </Link>

  </div>
</div>

          {/* Recent Enquiries */}
          <div className="mt-10">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Customer Enquiries
              </h2>

              <a
                href="/admin/enquiries"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View All →
              </a>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">

              {recentEnquiries.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No customer enquiries found.
                </div>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Enquiry
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Customer
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Product
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Qty
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Employee
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 bg-white">
                        {recentEnquiries.map((enquiry) => (
                          <tr key={enquiry.id}>
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                              {enquiry.enquiryCode}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                              <div>
                                {enquiry.customerName}
                              </div>

                              {enquiry.customerMobile && (
                                <div className="text-xs text-gray-500">
                                  {enquiry.customerMobile}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                              {enquiry.productName}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                              {enquiry.requiredQuantity}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                              {enquiry.submittedByName}
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                {enquiry.status.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="divide-y divide-gray-200 md:hidden">
                    {recentEnquiries.map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {enquiry.enquiryCode}
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              {enquiry.customerName}
                            </p>

                            {enquiry.customerMobile && (
                              <p className="text-xs text-gray-500">
                                {enquiry.customerMobile}
                              </p>
                            )}
                          </div>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {enquiry.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">
                              Product
                            </p>

                            <p className="font-medium text-gray-800">
                              {enquiry.productName}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Quantity
                            </p>

                            <p className="font-medium text-gray-800">
                              {enquiry.requiredQuantity}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Employee
                            </p>

                            <p className="font-medium text-gray-800">
                              {enquiry.submittedByName}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Date
                            </p>

                            <p className="font-medium text-gray-800">
                              {enquiry.createdAt.toLocaleDateString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Low Stock Alerts */}
<div className="mt-10">

  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold text-gray-900">
      Low Stock Alerts
    </h2>

    <a
      href="/admin/stock"
      className="text-sm font-medium text-blue-600 hover:text-blue-800"
    >
      Manage Stock →
    </a>
  </div>

  <div className="mt-4 overflow-hidden rounded-xl border border-red-200">

    {lowStockProducts.length === 0 ? (
      <div className="p-8 text-center">
        <p className="font-medium text-green-700">
          All products have sufficient stock.
        </p>

        <p className="mt-1 text-sm text-gray-500">
          No low-stock products at the moment.
        </p>
      </div>
    ) : (
      <>
        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-gray-200">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Product
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Product Code
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Current Stock
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Minimum Level
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">

              {lowStockProducts.map((product) => (
                <tr key={product.id}>

                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {product.name}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600">
                    {product.productCode}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-red-600">
                    {product.currentStock} {product.unit}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">
                    {product.minimumStockLevel} {product.unit}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      LOW STOCK
                    </span>
                  </td>

                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-gray-200 md:hidden">

          {lowStockProducts.map((product) => (
            <div
              key={product.id}
              className="p-4"
            >

              <div className="flex items-start justify-between gap-3">

                <div>
                  <p className="font-semibold text-gray-900">
                    {product.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {product.productCode}
                  </p>
                </div>

                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  LOW STOCK
                </span>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-gray-500">
                    Current Stock
                  </p>

                  <p className="mt-1 font-semibold text-red-600">
                    {product.currentStock} {product.unit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Minimum Level
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {product.minimumStockLevel} {product.unit}
                  </p>
                </div>

              </div>

            </div>
          ))}

        </div>
      </>
    )}

  </div>
</div>
        </div>
      </div>
    </main>
  );
}