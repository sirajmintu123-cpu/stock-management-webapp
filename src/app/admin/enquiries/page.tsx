"use client";

import { useEffect, useMemo, useState } from "react";

type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "CONVERTED"
  | "LOST"
  | "CANCELLED";

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

  status: EnquiryStatus;

  submittedByUserId: number;
  submittedByUserCode: string;
  submittedByName: string;

  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "CONVERTED",
  "LOST",
  "CANCELLED",
];

function getStatusClass(status: EnquiryStatus) {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-700";

    case "CONTACTED":
      return "bg-indigo-100 text-indigo-700";

    case "FOLLOW_UP":
      return "bg-yellow-100 text-yellow-700";

    case "CONVERTED":
      return "bg-green-100 text-green-700";

    case "LOST":
      return "bg-red-100 text-red-700";

    case "CANCELLED":
      return "bg-gray-200 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatStatus(status: EnquiryStatus) {
  if (status === "FOLLOW_UP") {
    return "Follow Up";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | EnquiryStatus
  >("ALL");

  const [search, setSearch] = useState("");

  const [selectedEnquiry, setSelectedEnquiry] =
    useState<Enquiry | null>(null);

  const [error, setError] = useState("");

  async function loadEnquiries() {
    try {
      setLoading(true);
      setError("");

      const url =
        statusFilter === "ALL"
          ? "/api/admin/enquiries"
          : `/api/admin/enquiries?status=${encodeURIComponent(
              statusFilter,
            )}`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load enquiries.",
        );
      }

      setEnquiries(data.enquiries || []);
    } catch (err) {
      console.error("Load enquiries error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load enquiries.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnquiries();
  }, [statusFilter]);

  const filteredEnquiries = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return enquiries;
    }

    return enquiries.filter((enquiry) => {
      return (
        enquiry.enquiryCode.toLowerCase().includes(keyword) ||
        enquiry.customerCode.toLowerCase().includes(keyword) ||
        enquiry.customerName.toLowerCase().includes(keyword) ||
        (enquiry.customerMobile || "")
          .toLowerCase()
          .includes(keyword) ||
        enquiry.productCode.toLowerCase().includes(keyword) ||
        enquiry.productName.toLowerCase().includes(keyword) ||
        enquiry.submittedByUserCode
          .toLowerCase()
          .includes(keyword) ||
        enquiry.submittedByName.toLowerCase().includes(keyword)
      );
    });
  }, [enquiries, search]);

  const summary = useMemo(() => {
    return {
      total: enquiries.length,
      new: enquiries.filter(
        (item) => item.status === "NEW",
      ).length,
      contacted: enquiries.filter(
        (item) => item.status === "CONTACTED",
      ).length,
      followUp: enquiries.filter(
        (item) => item.status === "FOLLOW_UP",
      ).length,
      converted: enquiries.filter(
        (item) => item.status === "CONVERTED",
      ).length,
    };
  }, [enquiries]);

  async function updateStatus(
    enquiry: Enquiry,
    newStatus: EnquiryStatus,
  ) {
    if (enquiry.status === newStatus) {
      return;
    }

    if (
      enquiry.status === "CONVERTED" &&
      newStatus !== "CONVERTED"
    ) {
      alert(
        "A converted enquiry cannot be moved back to another status.",
      );
      return;
    }

    try {
      setUpdatingId(enquiry.id);
      setError("");

      const response = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enquiryId: enquiry.id,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update enquiry status.",
        );
      }

      setEnquiries((current) =>
        current.map((item) =>
          item.id === enquiry.id
            ? {
                ...item,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      setSelectedEnquiry((current) =>
        current && current.id === enquiry.id
          ? {
              ...current,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
          : current,
      );
    } catch (err) {
      console.error("Update enquiry status error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Unable to update enquiry status.";

      setError(message);
      alert(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Customer Enquiries
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Review, manage and follow up customer enquiries.
            </p>
          </div>

          <button
            type="button"
            onClick={loadEnquiries}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Total Enquiries
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">New</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {summary.new}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Contacted</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {summary.contacted}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Follow Up</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {summary.followUp}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Converted</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {summary.converted}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Search Enquiries
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search enquiry, customer, mobile, product or employee..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "ALL"
                      | EnquiryStatus,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">All Statuses</option>

                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Loading enquiries...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredEnquiries.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              No enquiries found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try changing the search or status filter.
            </p>
          </div>
        )}

        {/* Desktop Table */}
        {!loading && filteredEnquiries.length > 0 && (
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                      Required
                    </th>

                    <th className="px-5 py-4">
                      Stock
                    </th>

                    <th className="px-5 py-4">
                      Expected Date
                    </th>

                    <th className="px-5 py-4">
                      Submitted By
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEnquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedEnquiry(enquiry)
                          }
                          className="font-semibold text-slate-900 hover:underline"
                        >
                          {enquiry.enquiryCode}
                        </button>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(
                            enquiry.createdAt,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {enquiry.customerName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {enquiry.customerCode}
                        </p>

                        <p className="text-xs text-slate-500">
                          {enquiry.customerMobile || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {enquiry.productName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {enquiry.productCode}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {enquiry.requiredQuantity}{" "}
                        {enquiry.productUnit}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            enquiry.currentStock >=
                            enquiry.requiredQuantity
                              ? "font-semibold text-green-600"
                              : "font-semibold text-red-600"
                          }
                        >
                          {enquiry.currentStock}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(
                          enquiry.expectedPurchaseDate,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {enquiry.submittedByName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {enquiry.submittedByUserCode}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            enquiry.status,
                          )}`}
                        >
                          {formatStatus(enquiry.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={enquiry.status}
                          disabled={
                            updatingId === enquiry.id ||
                            enquiry.status === "CONVERTED"
                          }
                          onChange={(event) =>
                            updateStatus(
                              enquiry,
                              event.target
                                .value as EnquiryStatus,
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {formatStatus(status)}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile Cards */}
        {!loading && filteredEnquiries.length > 0 && (
          <div className="space-y-4 lg:hidden">
            {filteredEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEnquiry(enquiry)
                      }
                      className="font-bold text-slate-900 hover:underline"
                    >
                      {enquiry.enquiryCode}
                    </button>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(enquiry.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      enquiry.status,
                    )}`}
                  >
                    {formatStatus(enquiry.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">
                      Customer
                    </p>
                    <p className="font-medium text-slate-900">
                      {enquiry.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {enquiry.customerMobile || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Product
                    </p>
                    <p className="font-medium text-slate-900">
                      {enquiry.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {enquiry.productCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Required
                    </p>
                    <p className="font-semibold text-slate-900">
                      {enquiry.requiredQuantity}{" "}
                      {enquiry.productUnit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Current Stock
                    </p>
                    <p
                      className={
                        enquiry.currentStock >=
                        enquiry.requiredQuantity
                          ? "font-semibold text-green-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {enquiry.currentStock}
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
                      Submitted By
                    </p>
                    <p className="font-medium text-slate-900">
                      {enquiry.submittedByName}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Update Status
                  </label>

                  <select
                    value={enquiry.status}
                    disabled={
                      updatingId === enquiry.id ||
                      enquiry.status === "CONVERTED"
                    }
                    onChange={(event) =>
                      updateStatus(
                        enquiry,
                        event.target
                          .value as EnquiryStatus,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedEnquiry(enquiry)
                  }
                  className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedEnquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Enquiry Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedEnquiry.enquiryCode}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEnquiry(null)
                }
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Status */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>

                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusClass(
                    selectedEnquiry.status,
                  )}`}
                >
                  {formatStatus(
                    selectedEnquiry.status,
                  )}
                </span>
              </div>

              {/* Customer */}
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      Customer Code
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedEnquiry.customerCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Customer Name
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedEnquiry.customerName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Mobile
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedEnquiry.customerMobile ||
                        "—"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Product */}
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Product
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      Product Code
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedEnquiry.productCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Product Name
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedEnquiry.productName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Required Quantity
                    </p>
                    <p className="font-semibold text-slate-900">
                      {selectedEnquiry.requiredQuantity}{" "}
                      {selectedEnquiry.productUnit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Current Stock
                    </p>
                    <p
                      className={
                        selectedEnquiry.currentStock >=
                        selectedEnquiry.requiredQuantity
                          ? "font-semibold text-green-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {selectedEnquiry.currentStock}{" "}
                      {selectedEnquiry.productUnit}
                    </p>
                  </div>
                </div>
              </section>

              {/* Enquiry Information */}
              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Enquiry Information
                </h3>

                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      Expected Purchase Date
                    </p>
                    <p className="font-medium text-slate-900">
                      {formatDate(
                        selectedEnquiry.expectedPurchaseDate,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Submitted By
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedEnquiry.submittedByName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedEnquiry.submittedByUserCode}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">
                      Remarks
                    </p>
                    <p className="whitespace-pre-wrap font-medium text-slate-900">
                      {selectedEnquiry.remarks || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Created
                    </p>
                    <p className="font-medium text-slate-900">
                      {formatDateTime(
                        selectedEnquiry.createdAt,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Last Updated
                    </p>
                    <p className="font-medium text-slate-900">
                      {formatDateTime(
                        selectedEnquiry.updatedAt,
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* Status Update */}
              {selectedEnquiry.status !== "CONVERTED" && (
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                    Update Status
                  </h3>

                  <select
                    value={selectedEnquiry.status}
                    disabled={
                      updatingId ===
                      selectedEnquiry.id
                    }
                    onChange={(event) =>
                      updateStatus(
                        selectedEnquiry,
                        event.target
                          .value as EnquiryStatus,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </section>
              )}

              {selectedEnquiry.status === "CONVERTED" && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  This enquiry has been converted to a
                  sale and cannot be moved back to another
                  enquiry status.
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() =>
                  setSelectedEnquiry(null)
                }
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}