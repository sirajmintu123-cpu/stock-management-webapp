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
  // Low stock
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

  // ---------------------------------------------------------
  // Recent enquiries
  // ---------------------------------------------------------

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
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            {/* Brand icon */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">

              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 7.5 12 3l8 4.5-8 4.5L4 7.5Z" />
                <path d="M4 12.5 12 17l8-4.5" />
                <path d="M4 17 12 21l8-4" />
              </svg>

            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold tracking-wide text-slate-900">
                Inventory Management
              </p>

              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Admin Workspace
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <Link
              href="/admin/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="3" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>

              <span className="hidden sm:inline">
                Profile
              </span>
            </Link>

            <AdminActions />

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Welcome */}
        <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#081525] via-[#0d1e35] to-[#102c4b] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-8">

          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">

            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">

              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />

              Admin Workspace

            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Good to see you, {user.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
              Monitor inventory, customer enquiries, sales and employee
              activity from one centralized workspace.
            </p>

          </div>

        </section>


        {/* =====================================================
            KPI CARDS
        ====================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Active Products"
            value={totalProducts}
            subtitle="Products currently active"
            icon="box"
            accent="blue"
          />

          <StatCard
            title="Current Stock"
            value={totalStock}
            subtitle="Total available quantity"
            icon="inventory"
            accent="cyan"
          />

          <StatCard
            title="Customer Enquiries"
            value={totalEnquiries}
            subtitle="All recorded enquiries"
            icon="users"
            accent="violet"
          />

          <StatCard
            title="Paid Sales"
            value={totalSales}
            subtitle="Completed paid sales"
            icon="chart"
            accent="emerald"
          />

        </section>


        {/* =====================================================
            QUICK ACCESS
        ====================================================== */}

        <section className="mt-8">

          <div className="flex items-end justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Workspace
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Quick Access
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage the core areas of your business.
              </p>
            </div>

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <QuickCard
              href="/admin/products"
              title="Products"
              description="Manage products and pricing"
              icon="box"
            />

            <QuickCard
              href="/admin/stock"
              title="Stock Management"
              description="Add stock and view history"
              icon="inventory"
            />

            <QuickCard
              href="/admin/enquiries"
              title="Enquiries"
              description="Manage customer enquiries"
              icon="message"
            />

            <QuickCard
              href="/admin/sales"
              title="Sales"
              description="Record and manage sales"
              icon="chart"
            />

            <QuickCard
              href="/admin/employees"
              title="Employees"
              description="Manage employee accounts"
              icon="users"
            />

          </div>

        </section>


        {/* =====================================================
            LOWER DASHBOARD
        ====================================================== */}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">


          {/* ===================================================
              RECENT ENQUIRIES
          ==================================================== */}

          <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Customer Activity
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Recent Enquiries
                </h2>
              </div>

              <Link
                href="/admin/enquiries"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                View All →
              </Link>

            </div>


            {recentEnquiries.length === 0 ? (
              <div className="px-6 py-14 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 5h14v11H8l-3 3V5Z" />
                  </svg>
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No customer enquiries
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  New enquiries will appear here.
                </p>

              </div>
            ) : (
              <>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">

                  <table className="min-w-full">

                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">

                        <TableHead>Enquiry</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Status</TableHead>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {recentEnquiries.map((enquiry) => (

                        <tr
                          key={enquiry.id}
                          className="transition hover:bg-slate-50/70"
                        >

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-800">
                            {enquiry.enquiryCode}
                          </td>

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-800">
                              {enquiry.customerName}
                            </p>

                            {enquiry.customerMobile && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {enquiry.customerMobile}
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {enquiry.productName}
                          </td>

                          <td className="px-5 py-4">

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              {enquiry.requiredQuantity}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {enquiry.submittedByName}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={enquiry.status} />
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>


                {/* Mobile */}
                <div className="divide-y divide-slate-100 md:hidden">

                  {recentEnquiries.map((enquiry) => (

                    <div
                      key={enquiry.id}
                      className="p-5 transition hover:bg-slate-50"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="font-bold text-slate-800">
                            {enquiry.enquiryCode}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {enquiry.customerName}
                          </p>

                          {enquiry.customerMobile && (
                            <p className="text-xs text-slate-400">
                              {enquiry.customerMobile}
                            </p>
                          )}
                        </div>

                        <StatusBadge status={enquiry.status} />

                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">

                        <InfoItem
                          label="Product"
                          value={enquiry.productName}
                        />

                        <InfoItem
                          label="Quantity"
                          value={String(enquiry.requiredQuantity)}
                        />

                        <InfoItem
                          label="Employee"
                          value={enquiry.submittedByName}
                        />

                        <InfoItem
                          label="Date"
                          value={enquiry.createdAt.toLocaleDateString(
                            "en-IN",
                          )}
                        />

                      </div>

                    </div>

                  ))}

                </div>

              </>
            )}

          </section>


          {/* ===================================================
              LOW STOCK
          ==================================================== */}

          <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">
                  Inventory Alert
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Low Stock
                </h2>
              </div>

              <Link
                href="/admin/stock"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                Manage →
              </Link>

            </div>


            {lowStockProducts.length === 0 ? (

              <div className="flex flex-col items-center px-6 py-14 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">

                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>

                </div>

                <p className="mt-4 font-bold text-slate-800">
                  Inventory looks healthy
                </p>

                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                  No active products are currently below their minimum stock level.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {lowStockProducts.map((product) => (

                  <div
                    key={product.id}
                    className="p-5 transition hover:bg-red-50/30"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-slate-800">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {product.productCode}
                        </p>

                      </div>

                      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                        Low
                      </span>

                    </div>


                    <div className="mt-4">

                      <div className="mb-2 flex items-center justify-between text-xs">

                        <span className="font-medium text-slate-400">
                          Current stock
                        </span>

                        <span className="font-bold text-red-600">
                          {product.currentStock} {product.unit}
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600"
                          style={{
                            width: `${Math.min(
                              100,
                              product.minimumStockLevel > 0
                                ? (Number(product.currentStock) /
                                    Number(product.minimumStockLevel)) *
                                    100
                                : 0,
                            )}%`,
                          }}
                        />

                      </div>

                      <p className="mt-2 text-[11px] text-slate-400">
                        Minimum level:{" "}
                        <span className="font-semibold text-slate-600">
                          {product.minimumStockLevel} {product.unit}
                        </span>
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        </div>


        {/* Footer */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row">

          <p>
            Inventory Management System
          </p>

          <p>
            Admin Workspace • {new Date().getFullYear()}
          </p>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: "box" | "inventory" | "users" | "chart";
  accent: "blue" | "cyan" | "violet" | "emerald";
}) {
  const accents = {
    blue: "from-blue-500 to-indigo-600 bg-blue-50 text-blue-600",
    cyan: "from-cyan-500 to-blue-600 bg-cyan-50 text-cyan-600",
    violet: "from-violet-500 to-indigo-600 bg-violet-50 text-violet-600",
    emerald: "from-emerald-500 to-teal-600 bg-emerald-50 text-emerald-600",
  };

  const [gradient, iconBg, iconText] = accents[accent].split(" ");

  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">

      <div
        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07] blur-2xl`}
      />

      <div className="relative">

        <div className="flex items-center justify-between">

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} ${iconText}`}
          >
            <DashboardIcon type={icon} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
            Overview
          </span>

        </div>

        <p className="mt-5 text-sm font-semibold text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {value.toLocaleString("en-IN")}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   QUICK CARD
========================================================= */

function QuickCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: "box" | "inventory" | "message" | "chart" | "users";
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
    >

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600">
          <DashboardIcon type={icon} />
        </div>

        <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500">
          →
        </span>

      </div>

      <h3 className="mt-5 font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

    </Link>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  let classes =
    "bg-slate-100 text-slate-600";

  if (
    normalized.includes("PENDING") ||
    normalized.includes("NEW")
  ) {
    classes = "bg-amber-50 text-amber-700";
  }

  if (
    normalized.includes("CONVERT") ||
    normalized.includes("COMPLETED") ||
    normalized.includes("SOLD")
  ) {
    classes = "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("CANCEL") ||
    normalized.includes("REJECT")
  ) {
    classes = "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${classes}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}


/* =========================================================
   TABLE HEAD
========================================================= */

function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </th>
  );
}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}


/* =========================================================
   ICONS
========================================================= */

function DashboardIcon({
  type,
}: {
  type:
    | "box"
    | "inventory"
    | "users"
    | "chart"
    | "message";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
  };

  if (type === "box") {
    return (
      <svg {...common}>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4 7.5 12 12l8-4.5" />
        <path d="M12 12v9" />
      </svg>
    );
  }

  if (type === "inventory") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M6 7V4h12v3" />
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M15 5.5a3 3 0 0 1 0 5.8" />
        <path d="M16 14.5a5 5 0 0 1 4.5 5.5" />
      </svg>
    );
  }

  if (type === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 3-4 3 2 5-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 5h14v11H8l-3 3V5Z" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
    </svg>
  );
}