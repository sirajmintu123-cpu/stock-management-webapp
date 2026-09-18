"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  categoryId: number | null;
  categoryName: string | null;
  unit: string;
  sellingPrice: number;
  currentStock: number;
  minimumStockLevel: number;
};

type Enquiry = {
  id: number;
  enquiryCode: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  productId: number;
  productName?: string;
  productCode?: string;
  requiredQuantity: number;
  expectedPurchaseDate: string | null;
  remarks: string | null;
  status: string;
  submittedByUserId: number;
  createdAt: string;
};

export default function EmployeeEnquiriesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState("");
  const [expectedPurchaseDate, setExpectedPurchaseDate] =
    useState("");
  const [remarks, setRemarks] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [showNewCustomer, setShowNewCustomer] =
    useState(false);

  const [newCustomerName, setNewCustomerName] =
    useState("");
  const [newCustomerMobile, setNewCustomerMobile] =
    useState("");
  const [newCustomerEmail, setNewCustomerEmail] =
    useState("");
  const [newCustomerAddress, setNewCustomerAddress] =
    useState("");
  const [newCustomerRemarks, setNewCustomerRemarks] =
    useState("");

  const [savingCustomer, setSavingCustomer] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) => String(product.id) === productId,
    );
  }, [products, productId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        customersResponse,
        productsResponse,
        enquiriesResponse,
      ] = await Promise.all([
        fetch("/api/employee/customers"),
        fetch("/api/employee/products"),
        fetch("/api/enquiries"),
      ]);

      const customersData =
        await customersResponse.json();

      const productsData =
        await productsResponse.json();

      const enquiriesData =
        await enquiriesResponse.json();

      if (
        !customersResponse.ok ||
        !customersData.success
      ) {
        throw new Error(
          customersData.message ||
            "Unable to load customers.",
        );
      }

      if (
        !productsResponse.ok ||
        !productsData.success
      ) {
        throw new Error(
          productsData.message ||
            "Unable to load products.",
        );
      }

      if (
        !enquiriesResponse.ok ||
        !enquiriesData.success
      ) {
        throw new Error(
          enquiriesData.message ||
            "Unable to load enquiries.",
        );
      }

      setCustomers(customersData.customers || []);
      setProducts(productsData.products || []);
      setEnquiries(enquiriesData.enquiries || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load enquiry data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateCustomer(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const name = newCustomerName.trim();
    const mobile = newCustomerMobile.trim();
    const email = newCustomerEmail.trim();
    const address = newCustomerAddress.trim();
    const customerRemarks =
      newCustomerRemarks.trim();

    if (!name) {
      setError("Customer name is required.");
      return;
    }

    if (!mobile) {
      setError("Mobile number is required.");
      return;
    }

    try {
      setSavingCustomer(true);

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
            email,
            address,
            remarks: customerRemarks,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.duplicate && data.customer) {
          throw new Error(
            `Customer already exists: ${data.customer.customerCode} — ${data.customer.name}`,
          );
        }

        throw new Error(
          data.message ||
            "Unable to create customer.",
        );
      }

      const newCustomer: Customer = {
        id: data.customer.id,
        customerCode: data.customer.customerCode,
        name: data.customer.name,
        mobile: data.customer.mobile,
        email: data.customer.email,
      };

      setCustomers((current) => [
        ...current,
        newCustomer,
      ]);

      // Automatically select newly created customer
      setCustomerId(String(newCustomer.id));

      // Clear search
      setCustomerSearch(
        `${newCustomer.name}`,
      );

      // Close modal
      setShowNewCustomer(false);

      // Clear new customer form
      setNewCustomerName("");
      setNewCustomerMobile("");
      setNewCustomerEmail("");
      setNewCustomerAddress("");
      setNewCustomerRemarks("");

      setMessage(
        `Customer ${newCustomer.customerCode} created successfully.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create customer.",
      );
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const quantity = Number(requiredQuantity);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError(
        "Required quantity must be a positive whole number.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/enquiries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: Number(customerId),
            productId: Number(productId),
            requiredQuantity: quantity,
            expectedPurchaseDate:
              expectedPurchaseDate || null,
            remarks: remarks.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit enquiry.",
        );
      }

      setMessage(
        `Enquiry ${
          data.enquiry?.enquiryCode || ""
        } submitted successfully.`,
      );

      setCustomerId("");
      setProductId("");
      setRequiredQuantity("");
      setExpectedPurchaseDate("");
      setRemarks("");
      setCustomerSearch("");
      setProductSearch("");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit enquiry.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCustomers =
    customers.filter((customer) => {
      const search =
        customerSearch.toLowerCase().trim();

      if (!search) return true;

      return (
        customer.name
          .toLowerCase()
          .includes(search) ||
        customer.customerCode
          .toLowerCase()
          .includes(search) ||
        (customer.mobile || "").includes(search)
      );
    });

  const filteredProducts =
    products.filter((product) => {
      const search =
        productSearch.toLowerCase().trim();

      if (!search) return true;

      return (
        product.name
          .toLowerCase()
          .includes(search) ||
        product.productCode
          .toLowerCase()
          .includes(search) ||
        (product.categoryName || "")
          .toLowerCase()
          .includes(search)
      );
    });

  function getStatusClass(status: string) {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-700";

      case "CONTACTED":
        return "bg-indigo-100 text-indigo-700";

      case "FOLLOW_UP":
        return "bg-amber-100 text-amber-700";

      case "CONVERTED":
        return "bg-green-100 text-green-700";

      case "LOST":
        return "bg-red-100 text-red-700";

      case "CANCELLED":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            Loading enquiry module...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Employee Panel
            </p>

            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Customer Enquiries
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Submit customer product requirements
              and track your enquiries.
            </p>
          </div>

          <a
            href="/employee"
            className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Dashboard
          </a>
        </div>

        {/* Messages */}
        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* New Enquiry */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              + New Customer Enquiry
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Record a customer's requirement.
              This will not reduce stock.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >

            {/* Customer */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Customer
              </label>

              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(
                    e.target.value,
                  );
                  setCustomerId("");
                }}
                placeholder="Search name, code or mobile..."
                className="mb-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={customerId}
                onChange={(e) => {
                  const id = e.target.value;

                  setCustomerId(id);

                  const selected =
                    customers.find(
                      (customer) =>
                        String(customer.id) ===
                        id,
                    );

                  if (selected) {
                    setCustomerSearch(
                      selected.name,
                    );
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select customer
                </option>

                {filteredCustomers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.customerCode} —{" "}
                      {customer.name}
                      {customer.mobile
                        ? ` — ${customer.mobile}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              {customerSearch &&
                filteredCustomers.length ===
                  0 && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      No matching customer found.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewCustomer(true)
                      }
                      className="mt-3 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      + Add New Customer
                    </button>
                  </div>
                )}

              <button
                type="button"
                onClick={() =>
                  setShowNewCustomer(true)
                }
                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                + Add New Customer
              </button>
            </div>

            {/* Product */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product
              </label>

              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(
                    e.target.value,
                  );
                  setProductId("");
                }}
                placeholder="Search product, code or category..."
                className="mb-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={productId}
                onChange={(e) => {
                  const id = e.target.value;

                  setProductId(id);

                  const selected =
                    products.find(
                      (product) =>
                        String(product.id) ===
                        id,
                    );

                  if (selected) {
                    setProductSearch(
                      selected.name,
                    );
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select product
                </option>

                {filteredProducts.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.productCode} —{" "}
                      {product.name}
                      {product.categoryName
                        ? ` — ${product.categoryName}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              {selectedProduct && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <span>
                      <span className="font-medium text-slate-500">
                        Available:
                      </span>{" "}
                      <span className="font-bold text-slate-900">
                        {
                          selectedProduct.currentStock
                        }{" "}
                        {selectedProduct.unit}
                      </span>
                    </span>

                    <span>
                      <span className="font-medium text-slate-500">
                        Min. Stock:
                      </span>{" "}
                      {
                        selectedProduct.minimumStockLevel
                      }
                    </span>
                  </div>

                  {selectedProduct.currentStock <=
                    selectedProduct.minimumStockLevel && (
                    <p className="mt-2 text-xs font-semibold text-amber-600">
                      Low stock — enquiry can
                      still be submitted.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Required Quantity
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={requiredQuantity}
                onChange={(e) =>
                  setRequiredQuantity(
                    e.target.value,
                  )
                }
                placeholder="Enter quantity"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Expected Purchase Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Expected Purchase Date
              </label>

              <input
                type="date"
                value={expectedPurchaseDate}
                onChange={(e) =>
                  setExpectedPurchaseDate(
                    e.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Remarks
              </label>

              <textarea
                rows={4}
                value={remarks}
                onChange={(e) =>
                  setRemarks(e.target.value)
                }
                placeholder="Enter customer requirement, preferred brand, additional details, etc."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Customer Enquiry"}
              </button>
            </div>
          </form>
        </section>

        {/* My Enquiries */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  My Enquiries
                </h2>

                <p className="text-sm text-slate-500">
                  Enquiries submitted by you.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                Total: {enquiries.length}
              </div>
            </div>
          </div>

          {enquiries.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No enquiries found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your submitted customer enquiries
                will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">
                        Enquiry
                      </th>

                      <th className="px-5 py-4">
                        Customer
                      </th>

                      <th className="px-5 py-4">
                        Product
                      </th>

                      <th className="px-5 py-4">
                        Qty
                      </th>

                      <th className="px-5 py-4">
                        Expected Date
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {enquiries.map(
                      (enquiry) => (
                        <tr
                          key={enquiry.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {
                              enquiry.enquiryCode
                            }
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">
                              {enquiry.customerName ||
                                `Customer #${enquiry.customerId}`}
                            </div>

                            {enquiry.customerCode && (
                              <div className="text-xs text-slate-500">
                                {
                                  enquiry.customerCode
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">
                              {enquiry.productName ||
                                `Product #${enquiry.productId}`}
                            </div>

                            {enquiry.productCode && (
                              <div className="text-xs text-slate-500">
                                {
                                  enquiry.productCode
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 font-semibold">
                            {
                              enquiry.requiredQuantity
                            }
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(
                              enquiry.expectedPurchaseDate,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                                enquiry.status,
                              )}`}
                            >
                              {enquiry.status.replace(
                                "_",
                                " ",
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(
                              enquiry.createdAt,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-4 md:hidden">
                {enquiries.map(
                  (enquiry) => (
                    <div
                      key={enquiry.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">
                            {
                              enquiry.enquiryCode
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {enquiry.customerName ||
                              `Customer #${enquiry.customerId}`}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                            enquiry.status,
                          )}`}
                        >
                          {enquiry.status.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">
                            Product
                          </p>

                          <p className="font-medium text-slate-900">
                            {enquiry.productName ||
                              `Product #${enquiry.productId}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Quantity
                          </p>

                          <p className="font-semibold text-slate-900">
                            {
                              enquiry.requiredQuantity
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Expected Purchase
                          </p>

                          <p className="font-medium text-slate-900">
                            {formatDate(
                              enquiry.expectedPurchaseDate,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Created
                          </p>

                          <p className="font-medium text-slate-900">
                            {formatDate(
                              enquiry.createdAt,
                            )}
                          </p>
                        </div>
                      </div>

                      {enquiry.remarks && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Remarks
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {
                              enquiry.remarks
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* New Customer Modal */}
      {showNewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add New Customer
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Customer code will be generated
                  automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNewCustomer(false)
                }
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateCustomer}
              className="space-y-4 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Name *
                </label>

                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) =>
                    setNewCustomerName(
                      e.target.value,
                    )
                  }
                  placeholder="Enter customer name"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mobile Number *
                </label>

                <input
                  type="tel"
                  value={newCustomerMobile}
                  onChange={(e) =>
                    setNewCustomerMobile(
                      e.target.value,
                    )
                  }
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) =>
                    setNewCustomerEmail(
                      e.target.value,
                    )
                  }
                  placeholder="customer@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Address
                </label>

                <textarea
                  rows={3}
                  value={newCustomerAddress}
                  onChange={(e) =>
                    setNewCustomerAddress(
                      e.target.value,
                    )
                  }
                  placeholder="Customer address"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Remarks
                </label>

                <textarea
                  rows={3}
                  value={newCustomerRemarks}
                  onChange={(e) =>
                    setNewCustomerRemarks(
                      e.target.value,
                    )
                  }
                  placeholder="Optional remarks"
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowNewCustomer(false)
                  }
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCustomer
                    ? "Saving..."
                    : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}