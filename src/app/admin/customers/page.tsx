"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Customer = {
  id: number;
  customerCode: string;
  name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(
    [],
  );

  const [customerCode, setCustomerCode] =
    useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [remarks, setRemarks] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/customers",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load customers.",
        );
      }

      setCustomers(data.customers || []);
    } catch (error) {
      console.error(
        "Load customers error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!customerCode.trim()) {
      setError("Customer code is required.");
      return;
    }

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/customers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerCode:
              customerCode.trim(),
            name: name.trim(),
            mobile: mobile.trim(),
            email: email.trim(),
            address: address.trim(),
            remarks: remarks.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to create customer.",
        );
        return;
      }

      setMessage(
        `Customer created successfully. Customer ID: ${data.customerId}`,
      );

      setCustomerCode("");
      setName("");
      setMobile("");
      setEmail("");
      setAddress("");
      setRemarks("");

      await loadCustomers();
    } catch (error) {
      console.error(
        "Create customer error:",
        error,
      );

      setError(
        "Unable to connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return customers;
    }

    return customers.filter(
      (customer) => {
        return (
          customer.customerCode
            .toLowerCase()
            .includes(keyword) ||
          customer.name
            .toLowerCase()
            .includes(keyword) ||
          (customer.mobile || "")
            .toLowerCase()
            .includes(keyword) ||
          (customer.email || "")
            .toLowerCase()
            .includes(keyword)
        );
      },
    );
  }, [customers, search]);

  const activeCustomers = customers.filter(
    (customer) => customer.isActive,
  ).length;

  const inactiveCustomers =
    customers.length - activeCustomers;

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Management
              </h1>

              <p className="mt-2 text-gray-600">
                Add and manage customer information.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCustomers}
              disabled={loading}
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {loading
                ? "Refreshing..."
                : "Refresh Customers"}
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

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Customers
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {customers.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Active Customers
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {activeCustomers}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Inactive Customers
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {inactiveCustomers}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Customer */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Add Customer
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              Enter the customer's basic information.
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Customer Code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Customer Code
                </label>

                <input
                  type="text"
                  value={customerCode}
                  onChange={(event) =>
                    setCustomerCode(
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Example: CUS001"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Customer Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Example: Rahul Das"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  value={mobile}
                  onChange={(event) =>
                    setMobile(event.target.value)
                  }
                  placeholder="Example: 9876543210"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Example: customer@example.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Address */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="Customer address"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
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
                    setRemarks(event.target.value)
                  }
                  placeholder="Optional remarks"
                  rows={3}
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
                  ? "Saving Customer..."
                  : "Add Customer"}
              </button>
            </form>
          </div>

          {/* Customer List */}
          <div className="rounded-2xl bg-white p-6 shadow-lg lg:col-span-2">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Customers
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredCustomers.length} customer
                  {filteredCustomers.length !== 1
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
                placeholder="Search customer..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black sm:w-72"
              />
            </div>

            {loading ? (
              <div className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-500">
                Loading customers...
              </div>
            ) : filteredCustomers.length ===
              0 ? (
              <div className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-500">
                {search
                  ? "No customers found for your search."
                  : "No customers found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Customer
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Code
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Mobile
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Email
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map(
                      (customer) => (
                        <tr
                          key={customer.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">
                              {customer.name}
                            </div>

                            {customer.address && (
                              <div className="mt-1 max-w-[250px] truncate text-xs text-gray-500">
                                {customer.address}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4 font-medium text-gray-700">
                            {
                              customer.customerCode
                            }
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {customer.mobile ||
                              "-"}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {customer.email ||
                              "-"}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                customer.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {customer.isActive
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
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