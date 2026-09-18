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
  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadStock() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/admin/stock",
        {
          cache: "no-store",
        },
      );

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
      const response = await fetch(
        "/api/admin/stock",
        {
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
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to update stock.",
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
        await loadHistory(
          historyProduct.id,
          false,
        );
      }
    } catch (error) {
      console.error(
        "Stock update error:",
        error,
      );

      setError(
        "Unable to connect to the server.",
      );
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
        setHistoryProduct(
          data.product || null,
        );
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

  function getStockStatus(
    product: StockProduct,
  ) {
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

  function getStockStatusClass(
    product: StockProduct,
  ) {
    if (product.currentStock <= 0) {
      return "bg-red-100 text-red-700";
    }

    if (
      product.currentStock <=
      product.minimumStockLevel
    ) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
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
      return "text-green-700";
    }

    return "text-red-700";
  }

  const filteredStock = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

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
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Stock Management
              </h1>

              <p className="mt-2 text-gray-600">
                Manage stock movements and view
                inventory history.
              </p>
            </div>

            <button
              type="button"
              onClick={loadStock}
              disabled={loading}
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {loading
                ? "Refreshing..."
                : "Refresh Stock"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Products
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalProducts}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Available
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {availableProducts}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Low Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {lowStockProducts}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Out of Stock
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {outOfStockProducts}
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Stock Movement Form */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Stock Movement
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              Add or adjust inventory stock.
            </p>

            <form
              onSubmit={handleStockSubmit}
              className="space-y-5"
            >
              {/* Product */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Product
                </label>

                <select
                  value={productId}
                  onChange={(event) =>
                    setProductId(
                      event.target.value,
                    )
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                >
                  <option value="">
                    Select Product
                  </option>

                  {stock
                    .filter(
                      (product) =>
                        product.isActive,
                    )
                    .map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.productCode} -{" "}
                        {product.name}{" "}
                        (Stock:{" "}
                        {product.currentStock})
                      </option>
                    ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value,
                    )
                  }
                  placeholder="Example: 50"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(
                      event.target.value,
                    )
                  }
                  placeholder="Example: New stock received"
                  rows={4}
                  required
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Updating Stock..."
                  : "Update Stock"}
              </button>
            </form>
          </div>

          {/* Stock Table */}
          <div className="rounded-2xl bg-white p-6 shadow-lg lg:col-span-2">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Stock
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredStock.length} product
                  {filteredStock.length !==
                  1
                    ? "s"
                    : ""}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search product..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black sm:w-64"
              />
            </div>

            {loading ? (
              <div className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-500">
                Loading stock...
              </div>
            ) : filteredStock.length ===
              0 ? (
              <div className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-500">
                No products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Product
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Code
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Stock
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Minimum
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStock.map(
                      (product) => {
                        const status =
                          getStockStatus(
                            product,
                          );

                        const statusClass =
                          getStockStatusClass(
                            product,
                          );

                        return (
                          <tr
                            key={product.id}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="px-4 py-4">
                              <div className="font-semibold text-gray-900">
                                {product.name}
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                Unit:{" "}
                                {product.unit}
                              </div>
                            </td>

                            <td className="px-4 py-4 font-medium text-gray-700">
                              {
                                product.productCode
                              }
                            </td>

                            <td className="px-4 py-4">
                              <span className="text-lg font-bold text-gray-900">
                                {
                                  product.currentStock
                                }
                              </span>

                              <span className="ml-1 text-xs text-gray-500">
                                {
                                  product.unit
                                }
                              </span>
                            </td>

                            <td className="px-4 py-4 text-gray-600">
                              {
                                product.minimumStockLevel
                              }
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
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
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                              >
                                History
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* History Modal */}
        {historyProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Stock History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {
                      historyProduct.name
                    }{" "}
                    ·{" "}
                    {
                      historyProduct.productCode
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHistoryProduct(
                      null,
                    );
                    setHistory([]);
                  }}
                  className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              {/* Product Summary */}
              <div className="grid gap-4 border-b bg-gray-50 px-6 py-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">
                    Product
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {
                      historyProduct.name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Current Stock
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {
                      historyProduct.currentStock
                    }{" "}
                    {
                      historyProduct.unit
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Minimum Stock
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {
                      historyProduct.minimumStockLevel
                    }
                  </p>
                </div>
              </div>

              {/* History Content */}
              <div className="max-h-[55vh] overflow-auto p-6">
                {historyLoading ? (
                  <div className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-500">
                    Loading history...
                  </div>
                ) : history.length ===
                  0 ? (
                  <div className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-500">
                    No stock history found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-3">
                            Date
                          </th>

                          <th className="px-4 py-3">
                            Transaction
                          </th>

                          <th className="px-4 py-3">
                            Type
                          </th>

                          <th className="px-4 py-3">
                            Quantity
                          </th>

                          <th className="px-4 py-3">
                            Previous
                          </th>

                          <th className="px-4 py-3">
                            New Balance
                          </th>

                          <th className="px-4 py-3">
                            Performed By
                          </th>

                          <th className="px-4 py-3">
                            Remarks
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {history.map(
                          (item) => (
                            <tr
                              key={
                                item.id
                              }
                              className="border-b last:border-0"
                            >
                              <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                                {new Date(
                                  item.createdAt,
                                ).toLocaleString(
                                  "en-IN",
                                )}
                              </td>

                              <td className="px-4 py-4 font-medium">
                                {
                                  item.transactionCode
                                }
                              </td>

                              <td className="px-4 py-4">
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
                                className={`px-4 py-4 font-bold ${getTransactionClass(
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
                                {
                                  item.quantity
                                }
                              </td>

                              <td className="px-4 py-4">
                                {
                                  item.previousBalance
                                }
                              </td>

                              <td className="px-4 py-4 font-bold text-gray-900">
                                {
                                  item.newBalance
                                }
                              </td>

                              <td className="px-4 py-4">
                                User #
                                {
                                  item.performedByUserId
                                }
                              </td>

                              <td className="max-w-[220px] px-4 py-4 text-gray-600">
                                {item.remarks ||
                                  "-"}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryProduct(
                      null,
                    );
                    setHistory([]);
                  }}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}