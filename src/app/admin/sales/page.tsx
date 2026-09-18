"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: number;
  customerCode: string;
  name: string;
  mobile: string | null;
  email: string | null;
};

type Product = {
  id: number;
  productCode: string;
  name: string;
  categoryName: string | null;
  unit: string;
  sellingPrice: string | number;
  currentStock: number;
  minimumStockLevel: number;
};

type Enquiry = {
  id: number;
  enquiryCode: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  customerMobile: string | null;
  productId: number;
  productCode: string;
  productName: string;
  productUnit: string;
  currentStock: number;
  requiredQuantity: number;
  expectedPurchaseDate: string | null;
  remarks: string | null;
  status: string;
  submittedByUserCode: string;
  submittedByName: string;
  createdAt: string;
  updatedAt: string;
};

type SaleItem = {
  saleItemId: number;
  productId: number;
  productCode: string;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  previousBalance: number | null;
  newBalance: number | null;
};

type Sale = {
  id: number;
  saleCode: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  customerMobile: string | null;
  source: "DIRECT" | "ENQUIRY";
  enquiryId: number | null;
  saleDate: string;
  totalAmount: string | number;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID" | "CANCELLED";
  remarks: string | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
};

type DirectForm = {
  customerId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  remarks: string;
};

type EnquiryForm = {
  enquiryId: string;
  unitPrice: string;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  remarks: string;
};

const emptyDirectForm: DirectForm = {
  customerId: "",
  productId: "",
  quantity: "",
  unitPrice: "",
  paymentStatus: "PENDING",
  remarks: "",
};

const emptyEnquiryForm: EnquiryForm = {
  enquiryId: "",
  unitPrice: "",
  paymentStatus: "PENDING",
  remarks: "",
};

function formatCurrency(value: string | number) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStockStatus(product: Product | null) {
  if (!product) return null;

  if (product.currentStock <= 0) {
    return {
      label: "OUT OF STOCK",
      className:
        "bg-red-50 text-red-700 border border-red-200",
    };
  }

  if (product.currentStock <= product.minimumStockLevel) {
    return {
      label: "LOW STOCK",
      className:
        "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }

  return {
    label: "AVAILABLE",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
}

function paymentBadge(status: Sale["paymentStatus"]) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PARTIAL":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function AdminSalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeForm, setActiveForm] = useState<
    "DIRECT" | "ENQUIRY" | null
  >(null);
  const [showNewCustomer, setShowNewCustomer] =
  useState(false);

const [creatingCustomer, setCreatingCustomer] =
  useState(false);

const [newCustomerForm, setNewCustomerForm] = useState({
  name: "",
  mobile: "",
  email: "",
  address: "",
  remarks: "",
});

  const [directForm, setDirectForm] =
    useState<DirectForm>(emptyDirectForm);

  const [enquiryForm, setEnquiryForm] =
    useState<EnquiryForm>(emptyEnquiryForm);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<
    "ALL" | Sale["paymentStatus"]
  >("ALL");

  const [selectedSale, setSelectedSale] = useState<Sale | null>(
    null,
  );

  /*
   * ------------------------------------------------------------
   * LOAD DATA
   * ------------------------------------------------------------
   */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        customersResponse,
        productsResponse,
        enquiriesResponse,
        salesResponse,
      ] = await Promise.all([
        fetch("/api/employee/customers"),
        fetch("/api/employee/products"),
        fetch("/api/admin/enquiries"),
        fetch("/api/admin/sales"),
      ]);

      if (!customersResponse.ok) {
        throw new Error("Unable to load customers.");
      }

      if (!productsResponse.ok) {
        throw new Error("Unable to load products.");
      }

      if (!enquiriesResponse.ok) {
        throw new Error("Unable to load enquiries.");
      }

      if (!salesResponse.ok) {
        throw new Error("Unable to load sales.");
      }

      const customersData = await customersResponse.json();
      const productsData = await productsResponse.json();
      const enquiriesData = await enquiriesResponse.json();
      const salesData = await salesResponse.json();

      if (!customersData.success) {
        throw new Error(
          customersData.message || "Unable to load customers.",
        );
      }

      if (!productsData.success) {
        throw new Error(
          productsData.message || "Unable to load products.",
        );
      }

      if (!enquiriesData.success) {
        throw new Error(
          enquiriesData.message || "Unable to load enquiries.",
        );
      }

      if (!salesData.success) {
        throw new Error(
          salesData.message || "Unable to load sales.",
        );
      }

      setCustomers(customersData.customers || []);
      setProducts(productsData.products || []);
      setEnquiries(enquiriesData.enquiries || []);
      setSales(salesData.sales || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * ------------------------------------------------------------
   * DIRECT SALE
   * ------------------------------------------------------------
   */

  const selectedDirectProduct = useMemo(() => {
    if (!directForm.productId) return null;

    return (
      products.find(
        (product) =>
          product.id === Number(directForm.productId),
      ) || null
    );
  }, [directForm.productId, products]);

  const directQuantity = Number(directForm.quantity || 0);
  const directUnitPrice = Number(directForm.unitPrice || 0);

  const directTotal =
    directQuantity > 0 && directUnitPrice >= 0
      ? directQuantity * directUnitPrice
      : 0;

  function openDirectSale() {
    setError("");
    setSuccess("");
    setDirectForm(emptyDirectForm);
    setActiveForm("DIRECT");
  }

  function closeDirectSale() {
    if (saving) return;

    setActiveForm(null);
    setDirectForm(emptyDirectForm);
  }

  function handleDirectProductChange(productId: string) {
    const product = products.find(
      (item) => item.id === Number(productId),
    );

    setDirectForm((previous) => ({
      ...previous,
      productId,
      unitPrice: product
        ? String(product.sellingPrice)
        : "",
    }));
  }

  async function createNewCustomer() {
  setError("");
  setSuccess("");

  const name = newCustomerForm.name.trim();
  const mobile = newCustomerForm.mobile.trim();
  const email = newCustomerForm.email.trim();

  if (!name) {
    setError("Customer name is required.");
    return;
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    setError(
      "Please enter a valid 10-digit Indian mobile number.",
    );
    return;
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    setError("Please enter a valid email address.");
    return;
  }

  try {
    setCreatingCustomer(true);

    const response = await fetch(
      "/api/employee/customers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          mobile,
          email: email || null,
          address:
            newCustomerForm.address.trim() || null,
          remarks:
            newCustomerForm.remarks.trim() || null,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (data.duplicate) {
        throw new Error(
          "A customer with this mobile number already exists.",
        );
      }

      throw new Error(
        data.message || "Unable to create customer.",
      );
    }

    const newCustomer = data.customer;

    setCustomers((previous) => [
      newCustomer,
      ...previous,
    ]);

    setDirectForm((previous) => ({
      ...previous,
      customerId: String(newCustomer.id),
    }));

    setNewCustomerForm({
      name: "",
      mobile: "",
      email: "",
      address: "",
      remarks: "",
    });

    setShowNewCustomer(false);

    setSuccess(
      `Customer ${newCustomer.customerCode} created successfully.`,
    );
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to create customer.",
    );
  } finally {
    setCreatingCustomer(false);
  }
}

  async function submitDirectSale() {
    setError("");
    setSuccess("");

    const customerId = Number(directForm.customerId);
    const productId = Number(directForm.productId);
    const quantity = Number(directForm.quantity);
    const unitPrice = Number(directForm.unitPrice);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError("Please enter a valid selling price.");
      return;
    }

    if (
      selectedDirectProduct &&
      quantity > selectedDirectProduct.currentStock
    ) {
      setError(
        `Only ${selectedDirectProduct.currentStock} ${selectedDirectProduct.unit}(s) are currently available.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Create this direct sale?\n\nQuantity: ${quantity}\nSelling Price: ${formatCurrency(
        unitPrice,
      )}\nTotal: ${formatCurrency(
        directTotal,
      )}\n\nStock will be reduced automatically.`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          source: "DIRECT",
          paymentStatus: directForm.paymentStatus,
          remarks: directForm.remarks.trim() || null,
          items: [
            {
              productId,
              quantity,
              unitPrice,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to create sale.",
        );
      }

      setSuccess(
        `Sale ${data.sale.saleCode} created successfully.`,
      );

      setActiveForm(null);
      setDirectForm(emptyDirectForm);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create sale.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * ENQUIRY CONVERSION
   * ------------------------------------------------------------
   */

  const convertibleEnquiries = useMemo(() => {
    return enquiries.filter(
      (enquiry) =>
        enquiry.status === "NEW" ||
        enquiry.status === "CONTACTED" ||
        enquiry.status === "FOLLOW_UP",
    );
  }, [enquiries]);

  const selectedEnquiry = useMemo(() => {
    if (!enquiryForm.enquiryId) return null;

    return (
      enquiries.find(
        (enquiry) =>
          enquiry.id === Number(enquiryForm.enquiryId),
      ) || null
    );
  }, [enquiryForm.enquiryId, enquiries]);

  const enquiryQuantity =
    selectedEnquiry?.requiredQuantity || 0;

  const enquiryUnitPrice = Number(
    enquiryForm.unitPrice || 0,
  );

  const enquiryTotal =
    enquiryQuantity > 0 && enquiryUnitPrice >= 0
      ? enquiryQuantity * enquiryUnitPrice
      : 0;

  function openEnquiryConversion() {
    setError("");
    setSuccess("");
    setEnquiryForm(emptyEnquiryForm);
    setActiveForm("ENQUIRY");
  }

  function closeEnquiryConversion() {
    if (saving) return;

    setActiveForm(null);
    setEnquiryForm(emptyEnquiryForm);
  }

  function handleEnquiryChange(enquiryId: string) {
    const enquiry = enquiries.find(
      (item) => item.id === Number(enquiryId),
    );

    setEnquiryForm((previous) => ({
      ...previous,
      enquiryId,
      unitPrice: enquiry
        ? String(
            products.find(
              (product) => product.id === enquiry.productId,
            )?.sellingPrice || "",
          )
        : "",
    }));
  }

  async function submitEnquiryConversion() {
    setError("");
    setSuccess("");

    if (!selectedEnquiry) {
      setError("Please select an enquiry.");
      return;
    }

    const unitPrice = Number(enquiryForm.unitPrice);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError("Please enter a valid selling price.");
      return;
    }

    if (
      selectedEnquiry.requiredQuantity >
      selectedEnquiry.currentStock
    ) {
      setError(
        `Required quantity (${selectedEnquiry.requiredQuantity}) exceeds current stock (${selectedEnquiry.currentStock}).`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Convert enquiry ${selectedEnquiry.enquiryCode} into a sale?\n\nCustomer: ${
        selectedEnquiry.customerName
      }\nProduct: ${selectedEnquiry.productName}\nQuantity: ${
        selectedEnquiry.requiredQuantity
      }\nTotal: ${formatCurrency(
        enquiryTotal,
      )}\n\nThe enquiry will become CONVERTED and stock will be reduced automatically.`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedEnquiry.customerId,
          source: "ENQUIRY",
          enquiryId: selectedEnquiry.id,
          paymentStatus: enquiryForm.paymentStatus,
          remarks: enquiryForm.remarks.trim() || null,
          items: [
            {
              productId: selectedEnquiry.productId,
              quantity: selectedEnquiry.requiredQuantity,
              unitPrice,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to convert enquiry to sale.",
        );
      }

      setSuccess(
        `Enquiry ${selectedEnquiry.enquiryCode} converted successfully. Sale ${data.sale.saleCode} created.`,
      );

      setActiveForm(null);
      setEnquiryForm(emptyEnquiryForm);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to convert enquiry.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * SALES FILTERING
   * ------------------------------------------------------------
   */

  const filteredSales = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !searchValue ||
        sale.saleCode.toLowerCase().includes(searchValue) ||
        sale.customerCode
          .toLowerCase()
          .includes(searchValue) ||
        sale.customerName
          .toLowerCase()
          .includes(searchValue) ||
        (sale.customerMobile || "").includes(searchValue);

      const matchesPayment =
        paymentFilter === "ALL" ||
        sale.paymentStatus === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [sales, search, paymentFilter]);

  /*
   * ------------------------------------------------------------
   * SUMMARY
   * ------------------------------------------------------------
   */

  const totalSales = sales.length;

  const paidSales = sales.filter(
    (sale) => sale.paymentStatus === "PAID",
  ).length;

  const pendingSales = sales.filter(
    (sale) =>
      sale.paymentStatus === "PENDING" ||
      sale.paymentStatus === "PARTIAL",
  ).length;

  const totalSalesAmount = sales.reduce(
    (total, sale) =>
      sale.paymentStatus === "CANCELLED"
        ? total
        : total + Number(sale.totalAmount || 0),
    0,
  );

  /*
   * ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-700">
                Sales
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sales Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record direct sales and convert customer enquiries
              into sales.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={openDirectSale}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              + Direct Sale
            </button>

            <button
              type="button"
              onClick={openEnquiryConversion}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Convert Enquiry
            </button>
          </div>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start justify-between gap-4">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="font-semibold text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <div className="flex items-start justify-between gap-4">
              <span>{success}</span>

              <button
                type="button"
                onClick={() => setSuccess("")}
                className="font-semibold text-emerald-600 hover:text-emerald-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Sales
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalSales}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              All recorded sales
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Paid Sales
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {paidSales}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Payment completed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pending / Partial
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingSales}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Payment requires follow-up
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Sales Amount
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(totalSalesAmount)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Excluding cancelled sales
            </p>
          </div>
        </div>

        {/* SALES TABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sales History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review all sales recorded by the administrator.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search sale, customer..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 sm:w-64"
                />

                <select
                  value={paymentFilter}
                  onChange={(event) =>
                    setPaymentFilter(
                      event.target.value as
                        | "ALL"
                        | Sale["paymentStatus"],
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                >
                  <option value="ALL">
                    All Payments
                  </option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">
                    Partial
                  </option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

              <p className="text-sm text-slate-500">
                Loading sales...
              </p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ₹
              </div>

              <h3 className="font-semibold text-slate-900">
                No sales found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search || paymentFilter !== "ALL"
                  ? "Try changing your search or filter."
                  : "No sales have been recorded yet."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Sale
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Customer
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Source
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Date
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Amount
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Payment
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {sale.saleCode}
                          </div>

                          {sale.enquiryId && (
                            <div className="mt-1 text-xs text-slate-400">
                              Enquiry #{sale.enquiryId}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {sale.customerName}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {sale.customerCode}
                            {sale.customerMobile
                              ? ` • ${sale.customerMobile}`
                              : ""}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              sale.source === "ENQUIRY"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {sale.source === "ENQUIRY"
                              ? "ENQUIRY"
                              : "DIRECT"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(sale.saleDate)}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatCurrency(
                            sale.totalAmount,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${paymentBadge(
                              sale.paymentStatus,
                            )}`}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSale(sale)
                            }
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900">
                          {sale.saleCode}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(sale.saleDate)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${paymentBadge(
                          sale.paymentStatus,
                        )}`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          Customer
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {sale.customerName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {sale.customerCode}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Source
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {sale.source}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Total
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatCurrency(
                            sale.totalAmount,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Mobile
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {sale.customerMobile || "-"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSale(sale)
                      }
                      className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View Sale
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ======================================================
          DIRECT SALE MODAL
          ====================================================== */}

      {activeForm === "DIRECT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Create Direct Sale
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Record a sale directly for a customer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDirectSale}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {/* CUSTOMER */}

              <div>
  <div className="mb-2 flex items-center justify-between gap-3">
    <label className="block text-sm font-semibold text-slate-700">
      Customer <span className="text-red-500">*</span>
    </label>

    <button
      type="button"
      onClick={() => {
        setError("");
        setShowNewCustomer(true);
      }}
      className="text-sm font-semibold text-slate-700 hover:text-slate-950"
    >
      + Add New Customer
    </button>
  </div>

  <select
    value={directForm.customerId}
    onChange={(event) =>
      setDirectForm((previous) => ({
        ...previous,
        customerId: event.target.value,
      }))
    }
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
  >
    <option value="">
      Select customer
    </option>

    {customers.map((customer) => (
      <option
        key={customer.id}
        value={customer.id}
      >
        {customer.customerCode} — {customer.name}
        {customer.mobile
          ? ` (${customer.mobile})`
          : ""}
      </option>
    ))}
  </select>
</div>
              {/* PRODUCT */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Product <span className="text-red-500">*</span>
                </label>

                <select
                  value={directForm.productId}
                  onChange={(event) =>
                    handleDirectProductChange(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.productCode} —{" "}
                      {product.name} — Stock:{" "}
                      {product.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRODUCT STOCK INFO */}

              {selectedDirectProduct && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Product
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedDirectProduct.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Available
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {
                          selectedDirectProduct.currentStock
                        }{" "}
                        {selectedDirectProduct.unit}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Min. Level
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {
                          selectedDirectProduct.minimumStockLevel
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      {(() => {
                        const status =
                          getStockStatus(
                            selectedDirectProduct,
                          );

                        return status ? (
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* QUANTITY */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantity{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={directForm.quantity}
                    onChange={(event) =>
                      setDirectForm((previous) => ({
                        ...previous,
                        quantity:
                          event.target.value,
                      }))
                    }
                    placeholder="Enter quantity"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
{selectedDirectProduct &&
  directQuantity > selectedDirectProduct.currentStock && (
    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
      <p className="text-xs font-semibold text-red-700">
        Quantity exceeds available stock.
      </p>

      <p className="mt-1 text-xs text-red-600">
        Available stock:{" "}
        {selectedDirectProduct.currentStock}{" "}
        {selectedDirectProduct.unit}
      </p>
    </div>
  )}
                </div>

                {/* PRICE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Selling Price{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={directForm.unitPrice}
                      onChange={(event) =>
                        setDirectForm((previous) => ({
                          ...previous,
                          unitPrice:
                            event.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-300 py-3 pl-8 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* TOTAL */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Sale Total
                  </span>

                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(directTotal)}
                  </span>
                </div>
              </div>

              {/* PAYMENT */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Status
                </label>

                <select
                  value={directForm.paymentStatus}
                  onChange={(event) =>
                    setDirectForm((previous) => ({
                      ...previous,
                      paymentStatus:
                        event.target.value as
                          | "PENDING"
                          | "PARTIAL"
                          | "PAID",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="PARTIAL">
                    Partial
                  </option>

                  <option value="PAID">
                    Paid
                  </option>
                </select>
              </div>

              {/* REMARKS */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Remarks
                </label>

                <textarea
                  rows={3}
                  value={directForm.remarks}
                  onChange={(event) =>
                    setDirectForm((previous) => ({
                      ...previous,
                      remarks:
                        event.target.value,
                    }))
                  }
                  placeholder="Optional remarks..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* WARNING */}

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Important:</strong> Creating this
                sale will automatically reduce the product
                stock and create a SALE transaction in the
                inventory ledger.
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDirectSale}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
  type="button"
  onClick={submitDirectSale}
  disabled={
    saving ||
    !selectedDirectProduct ||
    directQuantity <= 0 ||
    directQuantity > selectedDirectProduct.currentStock
  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating Sale..."
                    : "Create Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ENQUIRY CONVERSION MODAL
          ====================================================== */}

      {activeForm === "ENQUIRY" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Convert Enquiry to Sale
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Convert an active customer enquiry into
                    an actual sale.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEnquiryConversion}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {/* ENQUIRY */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Enquiry{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  value={enquiryForm.enquiryId}
                  onChange={(event) =>
                    handleEnquiryChange(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    Select active enquiry
                  </option>

                  {convertibleEnquiries.map(
                    (enquiry) => (
                      <option
                        key={enquiry.id}
                        value={enquiry.id}
                      >
                        {enquiry.enquiryCode} —{" "}
                        {enquiry.customerName} —{" "}
                        {enquiry.productName} — Qty:{" "}
                        {enquiry.requiredQuantity}
                      </option>
                    ),
                  )}
                </select>

                {convertibleEnquiries.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    No NEW, CONTACTED or FOLLOW_UP
                    enquiries are currently available.
                  </p>
                )}
              </div>

              {/* ENQUIRY DETAILS */}

              {selectedEnquiry && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        Enquiry
                      </p>

                      <p className="mt-1 font-bold text-blue-950">
                        {selectedEnquiry.enquiryCode}
                      </p>
                    </div>

                    <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                      {selectedEnquiry.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-blue-600">
                        Customer
                      </p>

                      <p className="mt-1 text-sm font-semibold text-blue-950">
                        {selectedEnquiry.customerName}
                      </p>

                      <p className="text-xs text-blue-700">
                        {selectedEnquiry.customerCode}
                        {selectedEnquiry.customerMobile
                          ? ` • ${selectedEnquiry.customerMobile}`
                          : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-blue-600">
                        Product
                      </p>

                      <p className="mt-1 text-sm font-semibold text-blue-950">
                        {selectedEnquiry.productName}
                      </p>

                      <p className="text-xs text-blue-700">
                        {selectedEnquiry.productCode}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-blue-600">
                        Required Quantity
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-950">
                        {selectedEnquiry.requiredQuantity}{" "}
                        {selectedEnquiry.productUnit}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-blue-600">
                        Available Stock
                      </p>

                      <p
                        className={`mt-1 text-lg font-bold ${
                          selectedEnquiry.currentStock >=
                          selectedEnquiry.requiredQuantity
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {selectedEnquiry.currentStock}{" "}
                        {selectedEnquiry.productUnit}
                      </p>
                    </div>
                  </div>

                  {selectedEnquiry.remarks && (
                    <div className="mt-4 border-t border-blue-200 pt-4">
                      <p className="text-xs text-blue-600">
                        Original Enquiry Remarks
                      </p>

                      <p className="mt-1 text-sm text-blue-900">
                        {selectedEnquiry.remarks}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PRICE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Selling Price{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={enquiryForm.unitPrice}
                    onChange={(event) =>
                      setEnquiryForm((previous) => ({
                        ...previous,
                        unitPrice:
                          event.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-8 pr-4 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* TOTAL */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Sale Total
                  </span>

                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(enquiryTotal)}
                  </span>
                </div>
              </div>

              {/* PAYMENT */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Status
                </label>

                <select
                  value={enquiryForm.paymentStatus}
                  onChange={(event) =>
                    setEnquiryForm((previous) => ({
                      ...previous,
                      paymentStatus:
                        event.target.value as
                          | "PENDING"
                          | "PARTIAL"
                          | "PAID",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="PARTIAL">
                    Partial
                  </option>

                  <option value="PAID">
                    Paid
                  </option>
                </select>
              </div>

              {/* REMARKS */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Remarks
                </label>

                <textarea
                  rows={3}
                  value={enquiryForm.remarks}
                  onChange={(event) =>
                    setEnquiryForm((previous) => ({
                      ...previous,
                      remarks:
                        event.target.value,
                    }))
                  }
                  placeholder="Optional sale remarks..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* WARNING */}

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Important:</strong> Converting the
                enquiry will create a sale, reduce stock
                automatically, and permanently mark the
                enquiry as <strong>CONVERTED</strong>.
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEnquiryConversion}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitEnquiryConversion}
                  disabled={saving || !selectedEnquiry}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Converting..."
                    : "Convert to Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          SALE DETAILS MODAL
          ====================================================== */}

      {/* ======================================================
    SALE DETAILS MODAL
    ====================================================== */}

{selectedSale && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

      {/* HEADER */}

      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sale Details
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {selectedSale.saleCode}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {formatDate(selectedSale.saleDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedSale(null)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>

        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">

        {/* SALE INFORMATION */}

        <section>
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Sale Information
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">

            <div>
              <p className="text-xs text-slate-400">
                Sale Code
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedSale.saleCode}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Sale Date
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(selectedSale.saleDate)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Source
              </p>

              <span
                className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                  selectedSale.source === "ENQUIRY"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {selectedSale.source}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Payment
              </p>

              <span
                className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${paymentBadge(
                  selectedSale.paymentStatus,
                )}`}
              >
                {selectedSale.paymentStatus}
              </span>
            </div>

          </div>
        </section>

        {/* CUSTOMER */}

        <section>
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Customer Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">

            <div>
              <p className="text-xs text-slate-400">
                Customer Code
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedSale.customerCode}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Customer Name
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedSale.customerName}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Mobile Number
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedSale.customerMobile || "-"}
              </p>
            </div>

          </div>
        </section>

        {/* PRODUCT / SALE ITEMS */}

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Product Details
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Products included in this sale.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {selectedSale.items.length}{" "}
              {selectedSale.items.length === 1
                ? "Item"
                : "Items"}
            </span>
          </div>

          {selectedSale.items.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              No product details are available for this sale.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">

              {/* DESKTOP */}

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">
                        Product
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Quantity
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Unit Price
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Line Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items.map((item) => (
                      <tr
                        key={item.saleItemId}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {item.productName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.productCode}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-900">
                            {item.quantity}
                          </span>

                          <span className="ml-1 text-xs text-slate-500">
                            {item.productUnit}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-900">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              {/* MOBILE */}

              <div className="divide-y divide-slate-100 sm:hidden">
                {selectedSale.items.map((item) => (
                  <div
                    key={item.saleItemId}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.productName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.productCode}
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </p>

                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3">

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Quantity
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {item.quantity}{" "}
                          {item.productUnit}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Unit Price
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatCurrency(item.unitPrice)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Line Total
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatCurrency(item.lineTotal)}
                        </p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </section>

        {/* STOCK MOVEMENT */}

        <section>
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Stock Movement
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Inventory balance before and after this sale.
            </p>
          </div>

          <div className="space-y-3">

            {selectedSale.items.map((item) => (
              <div
                key={item.saleItemId}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="mb-3">
                  <p className="text-sm font-semibold text-emerald-950">
                    {item.productName}
                  </p>

                  <p className="text-xs text-emerald-700">
                    {item.productCode}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">

                  <div>
                    <p className="text-[11px] text-emerald-600">
                      Previous Stock
                    </p>

                    <p className="mt-1 text-lg font-bold text-emerald-950">
                      {item.previousBalance ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-emerald-600">
                      Quantity Sold
                    </p>

                    <p className="mt-1 text-lg font-bold text-red-700">
                      -{item.quantity}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-emerald-600">
                      New Stock
                    </p>

                    <p className="mt-1 text-lg font-bold text-emerald-950">
                      {item.newBalance ?? "-"}
                    </p>
                  </div>

                </div>
              </div>
            ))}

          </div>
        </section>

        {/* ENQUIRY */}

        {selectedSale.enquiryId && (
          <section>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-700">
                  E
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Source Enquiry
                  </p>

                  <p className="mt-1 text-sm font-bold text-blue-950">
                    Enquiry #{selectedSale.enquiryId}
                  </p>

                  <p className="mt-1 text-xs text-blue-700">
                    This sale was created from a customer enquiry.
                  </p>
                </div>

              </div>

            </div>
          </section>
        )}

        {/* FINANCIAL SUMMARY */}

        <section>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Total Sale Amount
              </span>

              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(selectedSale.totalAmount)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm text-slate-500">
                Payment Status
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${paymentBadge(
                  selectedSale.paymentStatus,
                )}`}
              >
                {selectedSale.paymentStatus}
              </span>
            </div>

          </div>
        </section>

        {/* REMARKS */}

        {selectedSale.remarks && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-900">
              Remarks
            </h3>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm leading-6 text-slate-700">
                {selectedSale.remarks}
              </p>
            </div>
          </section>
        )}

        {/* SUCCESS INFORMATION */}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Inventory updated successfully
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                This sale has been recorded and the corresponding
                stock movement is stored in the inventory ledger.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER */}

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setSelectedSale(null)}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}
      
            {/* ======================================================
    NEW CUSTOMER MODAL
    ====================================================== */}

{showNewCustomer && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
    <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Create New Customer
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a customer before recording the sale.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewCustomer(false)}
            disabled={creatingCustomer}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>

        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">

        {/* NAME */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Customer Name{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            value={newCustomerForm.name}
            onChange={(event) =>
              setNewCustomerForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder="Enter customer name"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* MOBILE */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Mobile Number{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={newCustomerForm.mobile}
            onChange={(event) =>
              setNewCustomerForm((previous) => ({
                ...previous,
                mobile: event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10),
              }))
            }
            placeholder="10-digit mobile number"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* EMAIL */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Email
          </label>

          <input
            type="email"
            value={newCustomerForm.email}
            onChange={(event) =>
              setNewCustomerForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))
            }
            placeholder="customer@example.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* ADDRESS */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Address
          </label>

          <textarea
            rows={2}
            value={newCustomerForm.address}
            onChange={(event) =>
              setNewCustomerForm((previous) => ({
                ...previous,
                address: event.target.value,
              }))
            }
            placeholder="Customer address"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* REMARKS */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Remarks
          </label>

          <textarea
            rows={2}
            value={newCustomerForm.remarks}
            onChange={(event) =>
              setNewCustomerForm((previous) => ({
                ...previous,
                remarks: event.target.value,
              }))
            }
            placeholder="Optional remarks"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          />
        </div>

      </div>

      <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() => setShowNewCustomer(false)}
            disabled={creatingCustomer}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={createNewCustomer}
            disabled={creatingCustomer}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingCustomer
              ? "Creating Customer..."
              : "Create Customer"}
          </button>

        </div>
      </div>

    </div>
  </div>
)}
    </main>
  );
}