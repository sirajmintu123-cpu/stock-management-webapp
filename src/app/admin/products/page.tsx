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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
        setMessage(data.message || "Unable to create product.");
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
        product.productCode.toLowerCase().includes(keyword) ||
        product.name.toLowerCase().includes(keyword) ||
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

    if (product.currentStock <= product.minimumStockLevel) {
      return "LOW STOCK";
    }

    return "AVAILABLE";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>

          <p className="mt-2 text-gray-600">
            Add products and manage your inventory items.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Add Product */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-5 text-xl font-semibold">
              Add Product
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* Product Code */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Code
                </label>

                <input
                  type="text"
                  value={productCode}
                  onChange={(e) =>
                    setProductCode(e.target.value.toUpperCase())
                  }
                  placeholder="Example: EL-00125"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: LED Bulb 12W"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>

                <select
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories
                    .filter((category) => category.isActive)
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
              </div>

              {/* Unit */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Unit
                </label>

                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  <option value="Piece">Piece</option>
                  <option value="Box">Box</option>
                  <option value="Packet">Packet</option>
                  <option value="Kg">Kg</option>
                  <option value="Gram">Gram</option>
                  <option value="Litre">Litre</option>
                  <option value="Meter">Meter</option>
                  <option value="Set">Set</option>
                  <option value="Pair">Pair</option>
                </select>
              </div>

              {/* Selling Price */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Selling Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value)
                  }
                  placeholder="Example: 250.00"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* Minimum Stock */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Minimum Stock Level
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minimumStockLevel}
                  onChange={(e) =>
                    setMinimumStockLevel(e.target.value)
                  }
                  placeholder="Example: 20"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* Opening Stock */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Opening Stock
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={openingStock}
                  onChange={(e) =>
                    setOpeningStock(e.target.value)
                  }
                  placeholder="Example: 100"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(e.target.value)
                  }
                  placeholder="Optional remarks"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {message && (
                <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Add Product"}
              </button>
            </form>
          </div>

          {/* Product List */}
          <div className="rounded-2xl bg-white p-6 shadow-lg lg:col-span-2">

            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Products
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {products.length} product
                  {products.length !== 1 ? "s" : ""}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black sm:w-64"
              />
            </div>

            {loadingData ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                No products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">

                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3">
                        Code
                      </th>

                      <th className="px-4 py-3">
                        Product
                      </th>

                      <th className="px-4 py-3">
                        Category
                      </th>

                      <th className="px-4 py-3">
                        Price
                      </th>

                      <th className="px-4 py-3">
                        Stock
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus =
                        getStockStatus(product);

                      return (
                        <tr
                          key={product.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-4 font-semibold">
                            {product.productCode}
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>

                            <div className="text-xs text-gray-500">
                              Unit: {product.unit}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {product.categoryName || "-"}
                          </td>

                          <td className="px-4 py-4">
                            ₹
                            {Number(
                              product.sellingPrice,
                            ).toFixed(2)}
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-semibold">
                              {product.currentStock}
                            </div>

                            <div className="text-xs text-gray-500">
                              Min:{" "}
                              {product.minimumStockLevel}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {stockStatus}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}