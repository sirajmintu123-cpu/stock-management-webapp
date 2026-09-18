"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const [categories, setCategories] = useState<Category[]>(
    [],
  );

  const [products, setProducts] = useState<Product[]>(
    [],
  );

  // =======================================================
  // ADD PRODUCT FORM
  // =======================================================

  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("Piece");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minimumStockLevel, setMinimumStockLevel] =
    useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [remarks, setRemarks] = useState("");

  // =======================================================
  // SEARCH / GENERAL STATE
  // =======================================================

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // =======================================================
  // CREATE CATEGORY STATE
  // =======================================================

  const [showCreateCategory, setShowCreateCategory] =
    useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryDescription, setCategoryDescription] =
    useState("");

  const [creatingCategory, setCreatingCategory] =
    useState(false);

  const [categoryMessage, setCategoryMessage] =
    useState("");

  // =======================================================
  // EDIT PRODUCT STATE
  // =======================================================

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [editProductCode, setEditProductCode] =
    useState("");

  const [editName, setEditName] = useState("");

  const [editCategoryId, setEditCategoryId] =
    useState("");

  const [editUnit, setEditUnit] = useState("Piece");

  const [editSellingPrice, setEditSellingPrice] =
    useState("");

  const [editMinimumStockLevel, setEditMinimumStockLevel] =
    useState("");

  const [updatingProduct, setUpdatingProduct] =
    useState(false);

  // =======================================================
  // DELETE / DEACTIVATE STATE
  // =======================================================

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null);

  const [deleting, setDeleting] = useState(false);

  // =======================================================
  // LOAD CATEGORIES
  // =======================================================

  async function loadCategories() {
    const response = await fetch(
      "/api/admin/categories",
      {
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (data.success) {
      setCategories(data.categories);
    }
  }

  // =======================================================
  // LOAD PRODUCTS
  // =======================================================

  async function loadProducts() {
    const response = await fetch(
      "/api/admin/products",
      {
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (data.success) {
      setProducts(data.products);
    }
  }

  // =======================================================
  // LOAD ALL DATA
  // =======================================================

  async function loadData() {
    setLoadingData(true);

    try {
      await Promise.all([
        loadCategories(),
        loadProducts(),
      ]);
    } catch {
      setMessage(
        "Unable to load product data.",
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =======================================================
  // ADD PRODUCT
  // =======================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/products",
        {
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
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Unable to create product.",
        );
        return;
      }

      setMessage(
        "Product created successfully.",
      );

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
      setMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // CREATE CATEGORY
  // =======================================================

  async function handleCreateCategory(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setCategoryMessage("");
    setCreatingCategory(true);

    try {
      const response = await fetch(
        "/api/admin/categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: categoryName,
            categoryCode,
            description: categoryDescription,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setCategoryMessage(
          data.message ||
            "Unable to create category.",
        );
        return;
      }

      // Reload categories
      const categoriesResponse =
        await fetch(
          "/api/admin/categories",
          {
            cache: "no-store",
          },
        );

      const categoriesData =
        await categoriesResponse.json();

      if (categoriesData.success) {
        setCategories(
          categoriesData.categories,
        );

        // Automatically select newly-created category
        if (data.categoryId) {
          setCategoryId(
            String(data.categoryId),
          );
        }
      }

      setCategoryName("");
      setCategoryCode("");
      setCategoryDescription("");

      setCategoryMessage(
        "Category created successfully.",
      );

      // Close after short success indication
      setTimeout(() => {
        setShowCreateCategory(false);
        setCategoryMessage("");
      }, 700);
    } catch {
      setCategoryMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setCreatingCategory(false);
    }
  }

  // =======================================================
  // OPEN EDIT MODAL
  // =======================================================

  function openEditProduct(product: Product) {
    setEditingProduct(product);

    setEditProductCode(
      product.productCode,
    );

    setEditName(product.name);

    setEditCategoryId(
      String(product.categoryId),
    );

    setEditUnit(product.unit);

    setEditSellingPrice(
      String(product.sellingPrice),
    );

    setEditMinimumStockLevel(
      String(product.minimumStockLevel),
    );
  }

  // =======================================================
  // CLOSE EDIT MODAL
  // =======================================================

  function closeEditProduct() {
    if (updatingProduct) {
      return;
    }

    setEditingProduct(null);
    setEditProductCode("");
    setEditName("");
    setEditCategoryId("");
    setEditUnit("Piece");
    setEditSellingPrice("");
    setEditMinimumStockLevel("");
  }

  // =======================================================
  // UPDATE PRODUCT
  // =======================================================

  async function handleUpdateProduct(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    setUpdatingProduct(true);

    try {
      const response = await fetch(
        "/api/admin/products",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingProduct.id,
            productCode: editProductCode,
            name: editName,
            categoryId: editCategoryId,
            unit: editUnit,
            sellingPrice: editSellingPrice,
            minimumStockLevel:
              editMinimumStockLevel,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Unable to update product.",
        );
        return;
      }

      setMessage(
        "Product updated successfully.",
      );

      closeEditProduct();

      await loadProducts();
    } catch {
      setMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setUpdatingProduct(false);
    }
  }

  // =======================================================
  // OPEN DELETE CONFIRMATION
  // =======================================================

  function openDeleteProduct(product: Product) {
    setDeletingProduct(product);
  }

  // =======================================================
  // CLOSE DELETE CONFIRMATION
  // =======================================================

  function closeDeleteProduct() {
    if (deleting) {
      return;
    }

    setDeletingProduct(null);
  }

  // =======================================================
  // DEACTIVATE PRODUCT
  // =======================================================

  async function handleDeleteProduct() {
    if (!deletingProduct) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        "/api/admin/products",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: deletingProduct.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Unable to deactivate product.",
        );
        return;
      }

      setMessage(
        "Product deactivated successfully.",
      );

      closeDeleteProduct();

      await loadProducts();
    } catch {
      setMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setDeleting(false);
    }
  }

  // =======================================================
  // FILTER PRODUCTS
  // =======================================================

  const filteredProducts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    // Only active products in normal list
    const activeProducts =
      products.filter(
        (product) => product.isActive,
      );

    if (!keyword) {
      return activeProducts;
    }

    return activeProducts.filter(
      (product) => {
        return (
          product.productCode
            .toLowerCase()
            .includes(keyword) ||
          product.name
            .toLowerCase()
            .includes(keyword) ||
          (
            product.categoryName || ""
          )
            .toLowerCase()
            .includes(keyword)
        );
      },
    );
  }, [products, search]);

  // =======================================================
  // STOCK STATUS
  // =======================================================

  function getStockStatus(
    product: Product,
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

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7fb] text-slate-900">

      {/* =================================================
          PAGE HEADER
      ================================================== */}

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

            <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <BoxIcon />
              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Total Products
                </p>

                <p className="text-sm font-bold text-slate-800">
                  {products.filter(
                    (product) =>
                      product.isActive,
                  ).length}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          MAIN CONTENT
      ================================================== */}

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">


          {/* =================================================
              ADD PRODUCT
          ================================================== */}

          <section className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 bg-gradient-to-br from-[#081525] to-[#12345a] px-5 py-5 text-white sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <PlusIcon />
                </div>

                <div>

                  <h2 className="font-bold">
                    Add Product
                  </h2>

                  <p className="mt-0.5 text-xs text-white/50">
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

                  <div className="space-y-2">

                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) =>
                        setCategoryId(
                          e.target.value,
                        )
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
                        .map(
                          (category) => (
                            <option
                              key={
                                category.id
                              }
                              value={
                                category.id
                              }
                            >
                              {
                                category.categoryCode
                              }{" "}
                              -{" "}
                              {
                                category.name
                              }
                            </option>
                          ),
                        )}

                    </select>


                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateCategory(
                          true,
                        );
                        setCategoryMessage("");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-800"
                    >

                      <PlusIcon />

                      Create New Category

                    </button>

                  </div>

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

                    <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sm font-bold text-slate-400">
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
                      className="premium-input pl-8 leading-normal"
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
                    setRemarks(
                      e.target.value,
                    )
                  }
                  placeholder="Optional product notes..."
                  rows={3}
                  className="premium-input resize-none"
                />

              </FormField>


              {/* Message */}

              {message && (
                <MessageBox
                  message={message}
                />
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

            {/* List Header */}

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
                    {products.filter(
                      (product) =>
                        product.isActive,
                    ).length}{" "}
                    products
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
                      setSearch(
                        e.target.value,
                      )
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

            ) : filteredProducts.length ===
              0 ? (

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

              /* =================================================
                 IMPORTANT:
                 SAME TABLE ON DESKTOP + MOBILE
                 ONLY THIS AREA SCROLLS HORIZONTALLY
              ================================================== */

              <div className="product-table-scroll w-full max-w-full overflow-x-auto overscroll-x-contain">

                <table className="w-full min-w-[900px] text-left">

                  <thead>

                    <tr className="border-b border-slate-100 bg-slate-50/70">

                      <th className="whitespace-nowrap px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Product
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Category
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Price
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Stock
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Status
                      </th>

                      <th className="whitespace-nowrap px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Actions
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

                              <div className="flex min-w-[220px] items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500">
                                  <BoxIcon />
                                </div>

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-bold text-slate-800">
                                    {product.name}
                                  </p>

                                  <p className="mt-0.5 whitespace-nowrap text-xs text-slate-400">
                                    {product.productCode}
                                    {" • "}
                                    {product.unit}
                                  </p>

                                </div>

                              </div>

                            </td>


                            {/* Category */}

                            <td className="px-4 py-4">

                              <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
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
                                className={`whitespace-nowrap text-sm font-bold ${
                                  product.currentStock <=
                                  0
                                    ? "text-red-600"
                                    : product.currentStock <=
                                        product.minimumStockLevel
                                      ? "text-amber-600"
                                      : "text-slate-800"
                                }`}
                              >
                                {
                                  product.currentStock
                                }{" "}
                                <span className="text-xs font-medium text-slate-400">
                                  {
                                    product.unit
                                  }
                                </span>
                              </p>

                              <p className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">
                                Min:{" "}
                                {
                                  product.minimumStockLevel
                                }
                              </p>

                            </td>


                            {/* Status */}

                            <td className="px-4 py-4">

                              <StockBadge
                                status={
                                  stockStatus
                                }
                              />

                            </td>


                            {/* Actions */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditProduct(
                                      product,
                                    )
                                  }
                                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                                >
                                  <EditIcon />
                                  Edit
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    openDeleteProduct(
                                      product,
                                    )
                                  }
                                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                                >
                                  <TrashIcon />
                                  Delete
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      },
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

        </div>

      </div>


      {/* =====================================================
          CREATE CATEGORY MODAL
      ====================================================== */}

      {showCreateCategory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreateCategory(false);
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-2xl">

            <div className="bg-gradient-to-br from-[#081525] to-[#12345a] px-5 py-5 text-white sm:px-6">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <CategoryIcon />
                  </div>

                  <div>

                    <h2 className="font-bold">
                      Create New Category
                    </h2>

                    <p className="mt-0.5 text-xs text-white/50">
                      Add a category without leaving this page
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setShowCreateCategory(
                      false,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                >
                  <CloseIcon />
                </button>

              </div>

            </div>


            <form
              onSubmit={
                handleCreateCategory
              }
              className="space-y-4 p-5 sm:p-6"
            >

              <FormField
                label="Category Name"
                htmlFor="newCategoryName"
              >

                <input
                  id="newCategoryName"
                  type="text"
                  value={categoryName}
                  onChange={(e) =>
                    setCategoryName(
                      e.target.value,
                    )
                  }
                  placeholder="Example: Electrical"
                  required
                  className="premium-input"
                />

              </FormField>


              <FormField
                label="Category Code"
                htmlFor="newCategoryCode"
              >

                <input
                  id="newCategoryCode"
                  type="text"
                  value={categoryCode}
                  onChange={(e) =>
                    setCategoryCode(
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Example: ELEC"
                  required
                  className="premium-input"
                />

              </FormField>


              <FormField
                label="Description"
                htmlFor="newCategoryDescription"
                optional
              >

                <textarea
                  id="newCategoryDescription"
                  value={
                    categoryDescription
                  }
                  onChange={(e) =>
                    setCategoryDescription(
                      e.target.value,
                    )
                  }
                  placeholder="Optional category description..."
                  rows={3}
                  className="premium-input resize-none"
                />

              </FormField>


              {categoryMessage && (
                <MessageBox
                  message={
                    categoryMessage
                  }
                />
              )}


              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateCategory(
                      false,
                    )
                  }
                  disabled={
                    creatingCategory
                  }
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    creatingCategory
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {creatingCategory ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Create Category
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* =====================================================
          EDIT PRODUCT MODAL
      ====================================================== */}

      {editingProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !updatingProduct
            ) {
              closeEditProduct();
            }
          }}
        >

          <div className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-2xl">

            <div className="bg-gradient-to-br from-[#081525] to-[#12345a] px-5 py-5 text-white sm:px-6">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <EditIcon />
                  </div>

                  <div>

                    <h2 className="font-bold">
                      Edit Product
                    </h2>

                    <p className="mt-0.5 text-xs text-white/50">
                      Update product information
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={
                    closeEditProduct
                  }
                  disabled={
                    updatingProduct
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <CloseIcon />
                </button>

              </div>

            </div>


            <form
              onSubmit={
                handleUpdateProduct
              }
              className="space-y-4 p-5 sm:p-6"
            >

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <FormField
                  label="Product Code"
                  htmlFor="editProductCode"
                >

                  <input
                    id="editProductCode"
                    type="text"
                    value={
                      editProductCode
                    }
                    onChange={(e) =>
                      setEditProductCode(
                        e.target.value.toUpperCase(),
                      )
                    }
                    required
                    className="premium-input"
                  />

                </FormField>


                <FormField
                  label="Product Name"
                  htmlFor="editProductName"
                >

                  <input
                    id="editProductName"
                    type="text"
                    value={editName}
                    onChange={(e) =>
                      setEditName(
                        e.target.value,
                      )
                    }
                    required
                    className="premium-input"
                  />

                </FormField>

              </div>


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <FormField
                  label="Category"
                  htmlFor="editCategory"
                >

                  <select
                    id="editCategory"
                    value={
                      editCategoryId
                    }
                    onChange={(e) =>
                      setEditCategoryId(
                        e.target.value,
                      )
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
                      .map(
                        (category) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.categoryCode
                            }{" "}
                            -{" "}
                            {
                              category.name
                            }
                          </option>
                        ),
                      )}

                  </select>

                </FormField>


                <FormField
                  label="Unit"
                  htmlFor="editUnit"
                >

                  <select
                    id="editUnit"
                    value={editUnit}
                    onChange={(e) =>
                      setEditUnit(
                        e.target.value,
                      )
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


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <FormField
                  label="Selling Price"
                  htmlFor="editSellingPrice"
                >

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ₹
                    </span>

                    <input
                      id="editSellingPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editSellingPrice
                      }
                      onChange={(e) =>
                        setEditSellingPrice(
                          e.target.value,
                        )
                      }
                      required
                      className="premium-input pl-8 leading-normal"
                    />

                  </div>

                </FormField>


                <FormField
                  label="Minimum Stock"
                  htmlFor="editMinimumStock"
                >

                  <input
                    id="editMinimumStock"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      editMinimumStockLevel
                    }
                    onChange={(e) =>
                      setEditMinimumStockLevel(
                        e.target.value,
                      )
                    }
                    required
                    className="premium-input"
                  />

                </FormField>

              </div>


              {/* Stock protection notice */}

              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                <InfoIcon />

                <div>

                  <p className="text-xs font-bold text-blue-800">
                    Current stock is protected
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-blue-600">
                    Editing a product does not change its current stock. Stock changes must be recorded through the inventory/sales system.
                  </p>

                </div>

              </div>


              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeEditProduct
                  }
                  disabled={
                    updatingProduct
                  }
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    updatingProduct
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {updatingProduct ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon />
                      Save Changes
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* =====================================================
          DELETE CONFIRMATION
      ====================================================== */}

      {deletingProduct && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !deleting
            ) {
              closeDeleteProduct();
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-2xl">

            <div className="p-5 sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <TrashIcon />
                </div>

                <div className="min-w-0">

                  <h2 className="text-lg font-bold text-slate-900">
                    Deactivate Product?
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Are you sure you want to deactivate{" "}
                    <span className="font-bold text-slate-800">
                      {deletingProduct.name}
                    </span>
                    ?
                  </p>

                </div>

              </div>


              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">

                <p className="text-xs leading-5 text-amber-700">
                  The product will be removed from the active product list, but its inventory and sales history will remain preserved.
                </p>

              </div>


              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeDeleteProduct
                  }
                  disabled={deleting}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={
                    handleDeleteProduct
                  }
                  disabled={deleting}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {deleting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <TrashIcon />
                      Delete Product
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          GLOBAL STYLES
      ====================================================== */}

      <style jsx global>{`

        /* -----------------------------------------------
           Premium form inputs
        ------------------------------------------------ */

        .premium-input {
          width: 100%;
          min-width: 0;
          height: 48px;
          box-sizing: border-box;

          border-radius: 12px;
          border: 1px solid rgb(226 232 240);

          background: rgb(248 250 252);

          padding: 0 14px;

          font-family: inherit;
          font-size: 15px;
          font-weight: 400;
          line-height: 48px;

          color: rgb(30 41 59);

          outline: none;

          -webkit-appearance: none;
          appearance: none;

          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }


        .premium-input::placeholder {
          color: rgb(148 163 184);
          opacity: 1;
        }


        .premium-input:hover {
          border-color: rgb(203 213 225);
          background: white;
        }


        .premium-input:focus {
          border-color: rgb(96 165 250);
          background: white;

          box-shadow:
            0 0 0 4px
            rgb(59 130 246 / 0.06);
        }


        textarea.premium-input {
          height: auto;
          min-height: 92px;

          padding-top: 12px;
          padding-bottom: 12px;

          line-height: 1.5;

          resize: vertical;
        }


        select.premium-input {
          cursor: pointer;
          line-height: normal;
          padding-right: 38px;
        }


        input.premium-input {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }


        /* -----------------------------------------------
           Mobile form inputs
        ------------------------------------------------ */

        @media (max-width: 640px) {

          .premium-input {
            height: 50px;

            padding: 0 14px;

            font-size: 16px;
            line-height: 50px;

            border-radius: 13px;
          }


          textarea.premium-input {
            min-height: 100px;

            padding:
              13px 14px;

            font-size: 16px;
            line-height: 1.5;
          }


          select.premium-input {
            height: 50px;

            font-size: 16px;
            line-height: normal;
          }

        }


        /* -----------------------------------------------
           Product table scrolling
        ------------------------------------------------ */

        .product-table-scroll {
          max-width: 100%;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }


        .product-table-scroll table {
          table-layout: auto;
        }


        /* -----------------------------------------------
           Prevent page-level horizontal movement
        ------------------------------------------------ */

        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
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
   MESSAGE BOX
========================================================= */

function MessageBox({
  message,
}: {
  message: string;
}) {
  const success =
    message
      .toLowerCase()
      .includes("success");

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >

      <span className="mt-0.5 font-bold">
        {success ? "✓" : "!"}
      </span>

      <span>{message}</span>

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
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path d="m16 16 4 4" />
    </svg>
  );
}


/* =========================================================
   EDIT ICON
========================================================= */

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}


/* =========================================================
   TRASH ICON
========================================================= */

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="m9 7 .5-2h5l.5 2" />
      <path d="M6 7l1 14h10l1-14" />
    </svg>
  );
}


/* =========================================================
   SAVE ICON
========================================================= */

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4h11l3 3v13H5Z" />
      <path d="M8 4v6h8V4" />
      <path d="M8 20v-6h8v6" />
    </svg>
  );
}


/* =========================================================
   CATEGORY ICON
========================================================= */

function CategoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 6h16" />
      <path d="M7 6v12" />
      <path d="M17 6v12" />
      <path d="M4 18h16" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </svg>
  );
}


/* =========================================================
   CLOSE ICON
========================================================= */

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}


/* =========================================================
   INFO ICON
========================================================= */

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}