"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Category = {
  id: number;
  categoryCode: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type Product = {
  id: number;
  productCode: string;
  name: string;
  categoryId: number;
  categoryName: string | null;
  unit: string;
  sellingPrice: string | number;
  currentStock: number;
  minimumStockLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("Piece");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minimumStockLevel, setMinimumStockLevel] = useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [remarks, setRemarks] = useState("");

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  async function loadCategories() {
    const response = await fetch("/api/admin/categories");
    const data = await response.json();

    if (data.success) {
      setCategories(data.categories);
    }
  }

  async function loadProducts() {
    const response = await fetch("/api/admin/products");
    const data = await response.json();

    if (data.success) {
      setProducts(data.products);
    }
  }

  async function loadData() {
    setLoadingData(true);

    try {
      await Promise.all([
        loadCategories(),
        loadProducts(),
      ]);
    } catch {
      setMessage("Unable to load product data.");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productCode,
          name,
          categoryId,
          unit,
          sellingPrice,
          minimumStockLevel,
          openingStock,
          remarks,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "Unable to create product.",
        );
        return;
      }

      setMessage("Product created successfully.");

      setProductCode("");
      setName("");
      setCategoryId("");
      setUnit("Piece");
      setSellingPrice("");
      setMinimumStockLevel("");
      setOpeningStock("");
      setRemarks("");

      await loadProducts();
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.productCode
          .toLowerCase()
          .includes(keyword) ||
        product.name
          .toLowerCase()
          .includes(keyword) ||
        (product.categoryName || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [products, search]);

  function getStockStatus(product: Product) {
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

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="border-b border-slate-200/80 bg-white">

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Inventory
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Product Management
              </h1>

              <p className="mt-1.5 text-sm text-slate-500">
                Add products and manage your inventory catalogue.
              </p>

            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <BoxIcon />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Total Products
                </p>

                <p className="text-sm font-bold text-slate-800">
                  {products.length}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">


          {/* =================================================
              ADD PRODUCT FORM
          ================================================== */}

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

            {/* Form header */}
            <div className="border-b border-slate-100 bg-gradient-to-br from-[#081525] to-[#12345a] px-5 py-5 text-white sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <PlusIcon />
                </div>

                <div>
                  <h2 className="font-bold">
                    Add Product
                  </h2>

                  <p className="mt-0.5 text-xs text-white/45">
                    Create a new inventory item
                  </p>
                </div>

              </div>

            </div>


            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-5 sm:p-6"
            >

              {/* Product Code */}
              <FormField
                label="Product Code"
                htmlFor="productCode"
              >

                <input
                  id="productCode"
                  type="text"
                  value={productCode}
                  onChange={(e) =>
                    setProductCode(
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Example: EL-00125"
                  required
                  className="premium-input"
                />

              </FormField>


              {/* Product Name */}
              <FormField
                label="Product Name"
                htmlFor="productName"
              >

                <input
                  id="productName"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Example: LED Bulb 12W"
                  required
                  className="premium-input"
                />

              </FormField>


              {/* Category + Unit */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <FormField
                  label="Category"
                  htmlFor="category"
                >

                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(e.target.value)
                    }
                    required
                    className="premium-input appearance-none bg-white"
                  >

                    <option value="">
                      Select Category
                    </option>

                    {categories
                      .filter(
                        (category) =>
                          category.isActive,
                      )
                      .map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.categoryCode} -{" "}
                          {category.name}
                        </option>
                      ))}

                  </select>

                </FormField>


                <FormField
                  label="Unit"
                  htmlFor="unit"
                >

                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) =>
                      setUnit(e.target.value)
                    }
                    className="premium-input appearance-none bg-white"
                  >

                    <option value="Piece">
                      Piece
                    </option>

                    <option value="Box">
                      Box
                    </option>

                    <option value="Packet">
                      Packet
                    </option>

                    <option value="Kg">
                      Kg
                    </option>

                    <option value="Gram">
                      Gram
                    </option>

                    <option value="Litre">
                      Litre
                    </option>

                    <option value="Meter">
                      Meter
                    </option>

                    <option value="Set">
                      Set
                    </option>

                    <option value="Pair">
                      Pair
                    </option>

                  </select>

                </FormField>

              </div>


              {/* Price + Minimum Stock */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <FormField
                  label="Selling Price"
                  htmlFor="sellingPrice"
                >

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ₹
                    </span>

                    <input
                      id="sellingPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) =>
                        setSellingPrice(
                          e.target.value,
                        )
                      }
                      placeholder="250.00"
                      required
                      className="premium-input pl-8"
                    />

                  </div>

                </FormField>


                <FormField
                  label="Minimum Stock"
                  htmlFor="minimumStock"
                >

                  <input
                    id="minimumStock"
                    type="number"
                    min="0"
                    step="1"
                    value={minimumStockLevel}
                    onChange={(e) =>
                      setMinimumStockLevel(
                        e.target.value,
                      )
                    }
                    placeholder="20"
                    required
                    className="premium-input"
                  />

                </FormField>

              </div>


              {/* Opening Stock */}
              <FormField
                label="Opening Stock"
                htmlFor="openingStock"
              >

                <input
                  id="openingStock"
                  type="number"
                  min="0"
                  step="1"
                  value={openingStock}
                  onChange={(e) =>
                    setOpeningStock(
                      e.target.value,
                    )
                  }
                  placeholder="Example: 100"
                  required
                  className="premium-input"
                />

              </FormField>


              {/* Remarks */}
              <FormField
                label="Remarks"
                htmlFor="remarks"
                optional
              >

                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(e.target.value)
                  }
                  placeholder="Optional product notes..."
                  rows={3}
                  className="premium-input resize-none"
                />

              </FormField>


              {/* Message */}
              {message && (
                <div
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                    message.toLowerCase().includes(
                      "success",
                    )
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >

                  <span className="mt-0.5">
                    {message
                      .toLowerCase()
                      .includes("success")
                      ? "✓"
                      : "!"}
                  </span>

                  <span>{message}</span>

                </div>
              )}


              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >

                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving Product...
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    Add Product
                    <span className="text-lg transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}

              </button>

            </form>

          </section>


          {/* =================================================
              PRODUCT LIST
          ================================================== */}

          <section className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

            {/* List header */}
            <div className="border-b border-slate-100 p-5 sm:p-6">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    Catalogue
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                    Products
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {filteredProducts.length} of{" "}
                    {products.length} products
                  </p>

                </div>


                {/* Search */}
                <div className="relative w-full lg:max-w-[300px]">

                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search products..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5"
                  />

                </div>

              </div>

            </div>


            {/* Loading */}
            {loadingData ? (

              <div className="p-10 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="mt-4 text-sm text-slate-400">
                  Loading products...
                </p>

              </div>

            ) : filteredProducts.length === 0 ? (

              /* Empty */
              <div className="p-10 text-center sm:p-14">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <BoxIcon />
                </div>

                <p className="mt-4 font-bold text-slate-700">
                  No products found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Try another search or add a new product.
                </p>

              </div>

            ) : (

              <>

                {/* =================================================
                    DESKTOP TABLE
                ================================================== */}

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full text-left">

                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Product
                        </th>

                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Category
                        </th>

                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Price
                        </th>

                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Stock
                        </th>

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Status
                        </th>

                      </tr>
                    </thead>


                    <tbody className="divide-y divide-slate-100">

                      {filteredProducts.map(
                        (product) => {
                          const stockStatus =
                            getStockStatus(
                              product,
                            );

                          return (
                            <tr
                              key={product.id}
                              className="group transition hover:bg-slate-50/70"
                            >

                              {/* Product */}
                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500">
                                    <BoxIcon />
                                  </div>

                                  <div className="min-w-0">

                                    <p className="truncate text-sm font-bold text-slate-800">
                                      {product.name}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {product.productCode}
                                      {" • "}
                                      {product.unit}
                                    </p>

                                  </div>

                                </div>

                              </td>


                              {/* Category */}
                              <td className="px-4 py-4">

                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  {product.categoryName ||
                                    "-"}
                                </span>

                              </td>


                              {/* Price */}
                              <td className="whitespace-nowrap px-4 py-4">

                                <p className="text-sm font-bold text-slate-800">
                                  ₹
                                  {Number(
                                    product.sellingPrice,
                                  ).toFixed(2)}
                                </p>

                              </td>


                              {/* Stock */}
                              <td className="px-4 py-4">

                                <p
                                  className={`text-sm font-bold ${
                                    product.currentStock <=
                                    0
                                      ? "text-red-600"
                                      : product.currentStock <=
                                          product.minimumStockLevel
                                        ? "text-amber-600"
                                        : "text-slate-800"
                                  }`}
                                >
                                  {product.currentStock}{" "}
                                  <span className="text-xs font-medium text-slate-400">
                                    {product.unit}
                                  </span>
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  Min:{" "}
                                  {
                                    product.minimumStockLevel
                                  }
                                </p>

                              </td>


                              {/* Status */}
                              <td className="px-5 py-4">

                                <StockBadge
                                  status={
                                    stockStatus
                                  }
                                />

                              </td>

                            </tr>
                          );
                        },
                      )}

                    </tbody>

                  </table>

                </div>


                {/* =================================================
                    MOBILE PRODUCT CARDS
                ================================================== */}

                <div className="divide-y divide-slate-100 md:hidden">

                  {filteredProducts.map(
                    (product) => {
                      const stockStatus =
                        getStockStatus(product);

                      return (
                        <div
                          key={product.id}
                          className="p-4 transition active:bg-slate-50"
                        >

                          <div className="flex items-start gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500">
                              <BoxIcon />
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-bold text-slate-800">
                                    {product.name}
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-400">
                                    {product.productCode}
                                  </p>

                                </div>

                                <StockBadge
                                  status={
                                    stockStatus
                                  }
                                />

                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">

                                <ProductInfo
                                  label="Category"
                                  value={
                                    product.categoryName ||
                                    "-"
                                  }
                                />

                                <ProductInfo
                                  label="Unit"
                                  value={
                                    product.unit
                                  }
                                />

                                <ProductInfo
                                  label="Selling Price"
                                  value={`₹${Number(
                                    product.sellingPrice,
                                  ).toFixed(2)}`}
                                />

                                <ProductInfo
                                  label="Stock"
                                  value={`${product.currentStock} ${product.unit}`}
                                  danger={
                                    product.currentStock <=
                                    product.minimumStockLevel
                                  }
                                />

                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    },
                  )}

                </div>

              </>
            )}

          </section>

        </div>

      </div>


      {/* =====================================================
          PAGE STYLES
      ====================================================== */}

      <style jsx global>{`
        .premium-input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0 13px;
          font-size: 14px;
          color: rgb(30 41 59);
          outline: none;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        textarea.premium-input {
          height: auto;
          padding-top: 11px;
          padding-bottom: 11px;
        }

        .premium-input::placeholder {
          color: rgb(148 163 184);
        }

        .premium-input:hover {
          border-color: rgb(203 213 225);
          background: white;
        }

        .premium-input:focus {
          border-color: rgb(96 165 250);
          background: white;
          box-shadow: 0 0 0 4px rgb(59 130 246 / 0.06);
        }

        select.premium-input {
          cursor: pointer;
        }
      `}</style>

    </main>
  );
}


/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  htmlFor,
  children,
  optional = false,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>

      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
      >
        {label}

        {optional && (
          <span className="font-normal normal-case tracking-normal text-slate-400">
            (optional)
          </span>
        )}

      </label>

      {children}

    </div>
  );
}


/* =========================================================
   PRODUCT INFO
========================================================= */

function ProductInfo({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-0.5 truncate text-xs font-semibold ${
          danger
            ? "text-red-600"
            : "text-slate-700"
        }`}
      >
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   STOCK BADGE
========================================================= */

function StockBadge({
  status,
}: {
  status: string;
}) {
  if (status === "OUT OF STOCK") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-red-600">
        Out of Stock
      </span>
    );
  }

  if (status === "LOW STOCK") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-700">
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
      Available
    </span>
  );
}


/* =========================================================
   BOX ICON
========================================================= */

function BoxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5" />
      <path d="M12 12v9" />
    </svg>
  );
}


/* =========================================================
   PLUS ICON
========================================================= */

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}


/* =========================================================
   SEARCH ICON
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}