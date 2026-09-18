"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type StockProduct = {
  id: number;
  productCode: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStockLevel: number;
  isActive: boolean;
};

type StockHistory = {
  id: number;
  transactionCode: string;
  productId: number;
  transactionType:
    | "OPENING"
    | "PURCHASE"
    | "SALE"
    | "DAMAGE"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT"
    | "RETURN_IN"
    | "RETURN_OUT";
  quantity: number;
  previousBalance: number;
  newBalance: number;
  saleId: number | null;
  saleItemId: number | null;
  performedByUserId: number;
  remarks: string | null;
  createdAt: string;
};

type TransactionType =
  | "PURCHASE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
    </Icon>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
      <path d="M3 5v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
      <path d="M21 19v-5h-5" />
    </Icon>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </Icon>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Icon>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
    </Icon>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M10.3 3.3 2.1 17a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export default function StockManagementPage() {
  const [stock, setStock] = useState<StockProduct[]>([]);
  const [search, setSearch] = useState("");

  const [productId, setProductId] = useState("");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("PURCHASE");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const [historyProduct, setHistoryProduct] =
    useState<StockProduct | null>(null);

  const [history, setHistory] = useState<StockHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadStock() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/stock", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load stock.",
        );
      }

      setStock(data.stock || []);
    } catch (error) {
      console.error("Load stock error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load stock.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  async function handleStockSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    const numericQuantity = Number(quantity);

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        "Quantity must be a positive whole number.",
      );
      return;
    }

    if (!remarks.trim()) {
      setError(
        "Please enter remarks for this stock movement.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: numericQuantity,
          transactionType,
          remarks: remarks.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to update stock.",
        );
        return;
      }

      const transaction = data.transaction;

      setMessage(
        `Stock updated successfully. ${transaction.previousBalance} → ${transaction.newBalance}`,
      );

      setProductId("");
      setTransactionType("PURCHASE");
      setQuantity("");
      setRemarks("");

      await loadStock();

      if (historyProduct) {
        await loadHistory(historyProduct.id, false);
      }
    } catch (error) {
      console.error("Stock update error:", error);

      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  async function loadHistory(
    selectedProductId: number,
    showModal = true,
  ) {
    setHistoryLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/stock?productId=${selectedProductId}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load stock history.",
        );
      }

      setHistory(data.history || []);

      if (showModal) {
        setHistoryProduct(data.product || null);
      }
    } catch (error) {
      console.error(
        "Load stock history error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load stock history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function getStockStatus(product: StockProduct) {
    if (product.currentStock <= 0) {
      return "OUT OF STOCK";
    }

    if (
      product.currentStock <=
      product.minimumStockLevel
    ) {
      return "LOW STOCK";
    }

    return "AVAILABLE";
  }

  function getStockStatusClass(product: StockProduct) {
    if (product.currentStock <= 0) {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (
      product.currentStock <=
      product.minimumStockLevel
    ) {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  function getTransactionLabel(
    type: StockHistory["transactionType"],
  ) {
    switch (type) {
      case "OPENING":
        return "Opening Stock";

      case "PURCHASE":
        return "Purchase";

      case "SALE":
        return "Sale";

      case "DAMAGE":
        return "Damage";

      case "ADJUSTMENT_IN":
        return "Adjustment In";

      case "ADJUSTMENT_OUT":
        return "Adjustment Out";

      case "RETURN_IN":
        return "Return In";

      case "RETURN_OUT":
        return "Return Out";

      default:
        return type;
    }
  }

  function getTransactionClass(
    type: StockHistory["transactionType"],
  ) {
    if (
      type === "OPENING" ||
      type === "PURCHASE" ||
      type === "ADJUSTMENT_IN" ||
      type === "RETURN_IN"
    ) {
      return "text-emerald-700";
    }

    return "text-red-700";
  }

  const filteredStock = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return stock;
    }

    return stock.filter((product) => {
      return (
        product.productCode
          .toLowerCase()
          .includes(keyword) ||
        product.name
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [stock, search]);

  const totalProducts = stock.length;

  const availableProducts = stock.filter(
    (product) =>
      product.currentStock >
      product.minimumStockLevel,
  ).length;

  const lowStockProducts = stock.filter(
    (product) =>
      product.currentStock > 0 &&
      product.currentStock <=
        product.minimumStockLevel,
  ).length;

  const outOfStockProducts = stock.filter(
    (product) =>
      product.currentStock <= 0,
  ).length;

  return (
    <>
      <style jsx global>{`
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        .stock-table-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        .stock-table-scroll::-webkit-scrollbar {
          height: 7px;
        }

        .stock-table-scroll::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #cbd5e1;
        }

        .stock-table-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .stock-input,
        .stock-select,
        .stock-textarea {
          font-size: 16px;
        }

        @media (max-width: 640px) {
          .stock-input,
          .stock-select {
            min-height: 50px;
          }

          .stock-textarea {
            min-height: 120px;
          }
        }
      `}</style>

      <main className="min-h-screen overflow-x-hidden bg-slate-100 px-4 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-slate-700 text-white shadow-xl shadow-slate-300">
                  <PackageIcon className="h-7 w-7" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      Stock Management
                    </h1>

                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                      Inventory
                    </span>
                  </div>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                    Manage stock movements, monitor inventory
                    levels, and review complete stock history.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadStock}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshIcon
                  className={`h-4 w-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />

                {loading
                  ? "Refreshing..."
                  : "Refresh Stock"}
              </button>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700 shadow-sm">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                ✓
              </div>

              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Products
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {totalProducts}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Products in inventory
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <PackageIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Available
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                    {availableProducts}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Above minimum level
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowUpIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Low Stock
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
                    {lowStockProducts}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Needs attention
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Out of Stock
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                    {outOfStockProducts}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Currently unavailable
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ArrowDownIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Stock Movement */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-md">
                  <ArrowUpIcon className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Stock Movement
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Add or adjust inventory stock.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleStockSubmit}
                className="space-y-5"
              >
                {/* Product */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product
                  </label>

                  <select
                    value={productId}
                    onChange={(event) =>
                      setProductId(event.target.value)
                    }
                    required
                    className="stock-select w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10"
                  >
                    <option value="">
                      Select Product
                    </option>

                    {stock
                      .filter(
                        (product) => product.isActive,
                      )
                      .map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.productCode} -{" "}
                          {product.name} (Stock:{" "}
                          {product.currentStock})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Transaction Type
                  </label>

                  <select
                    value={transactionType}
                    onChange={(event) =>
                      setTransactionType(
                        event.target
                          .value as TransactionType,
                      )
                    }
                    className="stock-select w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10"
                  >
                    <option value="PURCHASE">
                      Purchase
                    </option>

                    <option value="ADJUSTMENT_IN">
                      Adjustment In
                    </option>

                    <option value="ADJUSTMENT_OUT">
                      Adjustment Out
                    </option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="Example: 50"
                    required
                    className="stock-input w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Remarks
                  </label>

                  <textarea
                    value={remarks}
                    onChange={(event) =>
                      setRemarks(event.target.value)
                    }
                    placeholder="Example: New stock received"
                    rows={4}
                    required
                    className="stock-textarea w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating Stock...
                    </>
                  ) : (
                    <>
                      <PackageIcon className="h-4 w-4" />
                      Update Stock
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Current Stock */}
            <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-950">
                      Current Stock
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {filteredStock.length}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Search and review current inventory levels.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search product..."
                    className="stock-input w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

                  <p className="text-sm font-medium text-slate-500">
                    Loading stock...
                  </p>
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                  <PackageIcon className="mx-auto h-8 w-8 text-slate-400" />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No products found
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Try changing your search.
                  </p>
                </div>
              ) : (
                <div className="stock-table-scroll rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Product
                        </th>

                        <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Code
                        </th>

                        <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Stock
                        </th>

                        <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Minimum
                        </th>

                        <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStock.map((product) => {
                        const status =
                          getStockStatus(product);

                        const statusClass =
                          getStockStatusClass(product);

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/80"
                          >
                            <td className="px-4 py-4">
                              <div className="font-semibold text-slate-900">
                                {product.name}
                              </div>

                              <div className="mt-1 text-xs text-slate-400">
                                Unit: {product.unit}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700">
                                {product.productCode}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-slate-950">
                                  {product.currentStock}
                                </span>

                                <span className="text-xs text-slate-400">
                                  {product.unit}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4 font-medium text-slate-600">
                              {product.minimumStockLevel}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex whitespace-nowrap items-center rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide ${statusClass}`}
                              >
                                {status}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  loadHistory(
                                    product.id,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                <HistoryIcon className="h-3.5 w-3.5" />
                                History
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile hint */}
              {!loading &&
                filteredStock.length > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400 sm:hidden">
                    <span>←</span>
                    <span>
                      Swipe horizontally to view the full table
                    </span>
                    <span>→</span>
                  </div>
                )}
            </section>
          </div>
        </div>

        {/* History Modal */}
        {historyProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
            <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <HistoryIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-950 sm:text-xl">
                      Stock History
                    </h2>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {historyProduct.name} ·{" "}
                      {historyProduct.productCode}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHistoryProduct(null);
                    setHistory([]);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Product Summary */}
              <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Product
                  </p>

                  <p className="mt-1.5 truncate font-semibold text-slate-900">
                    {historyProduct.name}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Current Stock
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {historyProduct.currentStock}{" "}
                    <span className="text-sm font-medium text-slate-400">
                      {historyProduct.unit}
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Minimum Stock
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {historyProduct.minimumStockLevel}
                  </p>
                </div>
              </div>

              {/* History Content */}
              <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
                {historyLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

                    <p className="text-sm font-medium text-slate-500">
                      Loading history...
                    </p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                    <HistoryIcon className="mx-auto h-8 w-8 text-slate-400" />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No stock history found
                    </p>
                  </div>
                ) : (
                  <div className="stock-table-scroll rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[1050px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Date
                          </th>

                          <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Transaction
                          </th>

                          <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Type
                          </th>

                          <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Quantity
                          </th>

                          <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Previous
                          </th>

                          <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            New Balance
                          </th>

                          <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Performed By
                          </th>

                          <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Remarks
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {history.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                              {new Date(
                                item.createdAt,
                              ).toLocaleString("en-IN")}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-semibold text-slate-700">
                              {item.transactionCode}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">
                              <span
                                className={`font-semibold ${getTransactionClass(
                                  item.transactionType,
                                )}`}
                              >
                                {getTransactionLabel(
                                  item.transactionType,
                                )}
                              </span>
                            </td>

                            <td
                              className={`whitespace-nowrap px-4 py-4 text-base font-bold ${getTransactionClass(
                                item.transactionType,
                              )}`}
                            >
                              {item.transactionType ===
                                "PURCHASE" ||
                              item.transactionType ===
                                "OPENING" ||
                              item.transactionType ===
                                "ADJUSTMENT_IN" ||
                              item.transactionType ===
                                "RETURN_IN"
                                ? "+"
                                : "-"}
                              {item.quantity}
                            </td>

                            <td className="px-4 py-4 font-medium text-slate-600">
                              {item.previousBalance}
                            </td>

                            <td className="px-4 py-4 font-bold text-slate-950">
                              {item.newBalance}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                              User #{item.performedByUserId}
                            </td>

                            <td className="max-w-[260px] px-4 py-4 text-slate-500">
                              <div className="truncate">
                                {item.remarks || "-"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {history.length > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400 sm:hidden">
                    <span>←</span>
                    <span>
                      Swipe horizontally to view history
                    </span>
                    <span>→</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryProduct(null);
                    setHistory([]);
                  }}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}