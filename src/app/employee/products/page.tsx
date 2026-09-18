"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  productCode: string;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  unit: string;
  sellingPrice: string | number;
  currentStock: number;
  minimumStockLevel: number;
};

type ProductDetails = Product;

type StockTransaction = {
  id: number;
  transactionCode: string;
  transactionType: string;
  quantity: number;
  previousBalance: number;
  newBalance: number;
  remarks: string | null;
  createdAt: string;
};

function getStockStatus(product: Product) {
  if (product.currentStock <= 0) {
    return {
      label: "OUT OF STOCK",
      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (product.currentStock <= product.minimumStockLevel) {
    return {
      label: "LOW STOCK",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "AVAILABLE",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeeProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<ProductDetails | null>(null);

  const [stockHistory, setStockHistory] = useState<
    StockTransaction[]
  >([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/employee/products",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load products.",
        );
      }

      setProducts(data.products || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.productCode
          .toLowerCase()
          .includes(term) ||
        product.name
          .toLowerCase()
          .includes(term) ||
        (product.categoryName || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [products, search]);

  async function openProductDetails(
    product: Product,
  ) {
    try {
      setSelectedProduct(product);
      setShowDetails(true);
      setHistoryLoading(true);
      setStockHistory([]);

      const response = await fetch(
        `/api/employee/products/${product.id}/history`,
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

      setStockHistory(data.history || []);
    } catch (err) {
      console.error(err);

      setStockHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeDetails() {
    setShowDetails(false);
    setSelectedProduct(null);
    setStockHistory([]);
  }

  const totalProducts = products.length;

  const availableProducts = products.filter(
    (product) =>
      product.currentStock >
      product.minimumStockLevel,
  ).length;

  const lowStockProducts = products.filter(
    (product) =>
      product.currentStock > 0 &&
      product.currentStock <=
        product.minimumStockLevel,
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.currentStock <= 0,
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/employee"
              className="mb-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Employee Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View products, available stock and
              stock movement history.
            </p>
          </div>

          <Link
            href="/employee/enquiries"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + New Customer Enquiry
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Products
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">
              Available
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">
              {availableProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">
              Low Stock
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-800">
              {lowStockProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm text-red-700">
              Out of Stock
            </p>
            <p className="mt-2 text-2xl font-bold text-red-800">
              {outOfStockProducts}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search Products
          </label>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by product name, code or category..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-800">
              No products found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try another search term.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-5 py-4">
                        Product
                      </th>

                      <th className="px-5 py-4">
                        Category
                      </th>

                      <th className="px-5 py-4">
                        Price
                      </th>

                      <th className="px-5 py-4">
                        Available Stock
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(
                      (product) => {
                        const status =
                          getStockStatus(product);

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {product.productCode}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {product.categoryName ||
                                "—"}
                            </td>

                            <td className="px-5 py-4 font-medium text-slate-800">
                              ₹
                              {Number(
                                product.sellingPrice,
                              ).toFixed(2)}
                              <span className="ml-1 text-xs font-normal text-slate-500">
                                / {product.unit}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-bold text-slate-900">
                                {product.currentStock}
                              </span>

                              <span className="ml-1 text-xs text-slate-500">
                                {product.unit}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  openProductDetails(
                                    product,
                                  )
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
              {filteredProducts.map(
                (product) => {
                  const status =
                    getStockStatus(product);

                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-slate-900">
                            {product.name}
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            {product.productCode}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Category
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {product.categoryName ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Price
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            ₹
                            {Number(
                              product.sellingPrice,
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Available Stock
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {product.currentStock}{" "}
                            {product.unit}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Minimum Level
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {
                              product.minimumStockLevel
                            }{" "}
                            {product.unit}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openProductDetails(
                            product,
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View Product & Stock History
                      </button>
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}
      </div>

      {/* Product Details Modal */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {selectedProduct.name}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedProduct.productCode}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg px-3 py-2 text-lg text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">

              {/* Product Information */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Product Information
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Category
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedProduct.categoryName ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Unit
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedProduct.unit}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Selling Price
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      ₹
                      {Number(
                        selectedProduct.sellingPrice,
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Minimum Stock
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {
                        selectedProduct.minimumStockLevel
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Stock */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-sm font-medium text-blue-700">
                  Current Available Stock
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-900">
                  {selectedProduct.currentStock}{" "}
                  <span className="text-base font-medium">
                    {selectedProduct.unit}
                  </span>
                </p>
              </div>

              {/* History */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Stock Movement History
                  </h3>

                  <span className="text-xs text-slate-500">
                    Read-only
                  </span>
                </div>

                {historyLoading ? (
                  <div className="rounded-xl border border-slate-200 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      Loading stock history...
                    </p>
                  </div>
                ) : stockHistory.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      No stock movement history found.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3">
                            Date
                          </th>

                          <th className="px-4 py-3">
                            Type
                          </th>

                          <th className="px-4 py-3">
                            Qty
                          </th>

                          <th className="px-4 py-3">
                            Balance
                          </th>

                          <th className="px-4 py-3">
                            Remarks
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {stockHistory.map(
                          (transaction) => (
                            <tr
                              key={
                                transaction.id
                              }
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                                {formatDate(
                                  transaction.createdAt,
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <span className="font-medium text-slate-800">
                                  {
                                    transaction.transactionType
                                  }
                                </span>
                              </td>

                              <td
                                className={`px-4 py-3 font-bold ${
                                  transaction.quantity <
                                  0
                                    ? "text-red-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {transaction.quantity >
                                0
                                  ? "+"
                                  : ""}
                                {
                                  transaction.quantity
                                }
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {
                                  transaction.newBalance
                                }
                              </td>

                              <td className="max-w-xs px-4 py-3 text-xs text-slate-500">
                                {transaction.remarks ||
                                  "—"}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Employee restriction notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800">
                  Employee Access
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Stock information is view-only.
                  Employees cannot add, reduce or
                  adjust stock from this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}   