"use client";

import { FormEvent, useEffect, useState } from "react";

type Category = {
  id: number;
  categoryCode: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    const response = await fetch("/api/admin/categories");
    const data = await response.json();

    if (data.success) {
      setCategories(data.categories);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          categoryCode,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Unable to create category.");
        return;
      }

      setMessage("Category created successfully.");

      setName("");
      setCategoryCode("");
      setDescription("");

      await loadCategories();
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Category Management
          </h1>

          <p className="mt-2 text-gray-600">
            Create and manage product categories.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Category */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-5 text-xl font-semibold">
              Add Category
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category Code
                </label>

                <input
                  type="text"
                  value={categoryCode}
                  onChange={(e) =>
                    setCategoryCode(e.target.value.toUpperCase())
                  }
                  placeholder="Example: ELEC"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: Electrical"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {message && (
                <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Add Category"}
              </button>
            </form>
          </div>

          {/* Category List */}
          <div className="rounded-2xl bg-white p-6 shadow-lg lg:col-span-2">
            <h2 className="mb-5 text-xl font-semibold">
              Categories
            </h2>

            {categories.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                No categories found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-3 font-semibold">
                          {category.categoryCode}
                        </td>

                        <td className="px-4 py-3">
                          {category.name}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {category.description || "-"}
                        </td>

                        <td className="px-4 py-3">
                          {category.isActive ? "Active" : "Inactive"}
                        </td>
                      </tr>
                    ))}
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