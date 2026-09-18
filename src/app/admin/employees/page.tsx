"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Employee = {
  id: number;
  employeeCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  joiningDate: string | null;
  address: string | null;
  employeeStatus: boolean;
  userStatus: boolean;
  createdAt: string;
};

type EmployeeForm = {
  name: string;
  phone: string;
  email: string;
  designation: string;
  joiningDate: string;
  password: string;
  address: string;
};

const initialForm: EmployeeForm = {
  name: "",
  phone: "",
  email: "",
  designation: "",
  joiningDate: "",
  password: "",
  address: "",
};

type EditEmployeeForm = {
  name: string;
  phone: string;
  email: string;
  designation: string;
  joiningDate: string;
  address: string;
};

const initialEditForm: EditEmployeeForm = {
  name: "",
  phone: "",
  email: "",
  designation: "",
  joiningDate: "",
  address: "",
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [form, setForm] =
    useState<EmployeeForm>(initialForm);

  const [editForm, setEditForm] =
    useState<EditEmployeeForm>(initialEditForm);

  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/employees?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load employees.",
        );
      }

      setEmployees(data.employees || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load employees.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [search]);

  function updateForm(
    field: keyof EmployeeForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openAddModal() {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (saving) return;

    setShowAddModal(false);
    setForm(initialForm);
    setError("");
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);

    setEditForm({
      name: employee.name || "",
      phone: employee.phone || "",
      email: employee.email || "",
      designation: employee.designation || "",
      joiningDate: employee.joiningDate
        ? new Date(employee.joiningDate)
            .toISOString()
            .split("T")[0]
        : "",
      address: employee.address || "",
    });

    setError("");
    setSuccess("");
    setShowEditModal(true);
  }

  function closeEditModal() {
    if (updating) return;

    setShowEditModal(false);
    setEditingEmployee(null);
    setEditForm(initialEditForm);
    setError("");
  }

  function updateEditForm(
    field: keyof EditEmployeeForm,
    value: string,
  ) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleEditSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingEmployee) {
      return;
    }

    setError("");
    setSuccess("");

    if (!editForm.name.trim()) {
      setError("Employee name is required.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(editForm.phone.trim())) {
      setError(
        "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `/api/admin/employees/${editingEmployee.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name.trim(),
            phone: editForm.phone.trim(),
            email: editForm.email.trim(),
            designation: editForm.designation.trim(),
            joiningDate: editForm.joiningDate,
            address: editForm.address.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update employee.",
        );
      }

      setSuccess("Employee updated successfully.");

      await loadEmployees();

      setTimeout(() => {
        setShowEditModal(false);
        setEditingEmployee(null);
        setEditForm(initialEditForm);
        setSuccess("");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update employee.",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggleStatus(employee: Employee) {
    const action = employee.employeeStatus
      ? "deactivate"
      : "activate";

    const actionLabel =
      action === "activate"
        ? "activate"
        : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${employee.name}?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setUpdating(true);

      const response = await fetch(
        `/api/admin/employees/${employee.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Unable to ${actionLabel} employee.`,
        );
      }

      setSuccess(
        action === "activate"
          ? `${employee.name} activated successfully.`
          : `${employee.name} deactivated successfully.`,
      );

      await loadEmployees();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${actionLabel} employee.`,
      );
    } finally {
      setUpdating(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Employee name is required.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setError(
        "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    if (form.password.length < 8) {
      setError(
        "Initial password must be at least 8 characters.",
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/employees",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            designation: form.designation.trim(),
            joiningDate: form.joiningDate,
            password: form.password,
            address: form.address.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create employee.",
        );
      }

      setSuccess(
        `Employee ${data.employee.employeeCode} created successfully.`,
      );

      setForm(initialForm);

      await loadEmployees();

      setTimeout(() => {
        setShowAddModal(false);
        setSuccess("");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) =>
      employee.employeeStatus && employee.userStatus,
  ).length;

  const inactiveEmployees =
    totalEmployees - activeEmployees;

  function formatDate(dateValue: string | null) {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getEmployeeStatus(employee: Employee) {
    return employee.employeeStatus &&
      employee.userStatus
      ? "ACTIVE"
      : "INACTIVE";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-blue-400">
              ADMIN PANEL
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Employee Management
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Create and manage employee accounts.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && !showAddModal && !showEditModal && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
            <p className="text-sm text-slate-400">
              Total Employees
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xl">
            <p className="text-sm text-slate-400">
              Active Employees
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {activeEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-xl">
            <p className="text-sm text-slate-400">
              Inactive Employees
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-400">
              {inactiveEmployees}
            </p>
          </div>
        </section>

        {/* Toolbar */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label
                htmlFor="employee-search"
                className="sr-only"
              >
                Search employees
              </label>

              <input
                id="employee-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by employee ID, name, phone, email or designation..."
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500"
            >
              + Add Employee
            </button>
          </div>
        </section>

        {/* Employee List */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-semibold">
              Employee List
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {loading
                ? "Loading employees..."
                : `${employees.length} employee${employees.length === 1 ? "" : "s"} found`}
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-slate-300">
                No employees found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first employee using the
                &quot;Add Employee&quot; button.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10 bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Employee
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Contact
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Designation
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Joining Date
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {employees.map((employee) => {
                      const status =
                        getEmployeeStatus(employee);

                      return (
                        <tr
                          key={employee.id}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-white">
                                {employee.name}
                              </p>

                              <p className="mt-1 text-xs font-medium text-blue-400">
                                {employee.employeeCode}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-200">
                              {employee.phone || "—"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {employee.email || "No email"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {employee.designation || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {formatDate(
                              employee.joiningDate,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
  <div className="flex items-center justify-end gap-2">
    <button
      type="button"
      onClick={() =>
        openEditModal(employee)
      }
      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
    >
      Edit
    </button>

    <button
      type="button"
      onClick={() =>
        handleToggleStatus(employee)
      }
      disabled={updating}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        employee.employeeStatus &&
        employee.userStatus
          ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
      }`}
    >
      {employee.employeeStatus &&
      employee.userStatus
        ? "Deactivate"
        : "Activate"}
    </button>
  </div>
</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-white/5 md:hidden">
                {employees.map((employee) => {
                  const status =
                    getEmployeeStatus(employee);

                  return (
                    <div
                      key={employee.id}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">
                            {employee.name}
                          </p>

                          <p className="mt-1 text-xs font-medium text-blue-400">
                            {employee.employeeCode}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                            status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">
                            Phone
                          </p>

                          <p className="mt-1 text-slate-200">
                            {employee.phone || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Email
                          </p>

                          <p className="mt-1 break-all text-slate-200">
                            {employee.email || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Designation
                          </p>

                          <p className="mt-1 text-slate-200">
                            {employee.designation || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Joining Date
                          </p>

                          <p className="mt-1 text-slate-200">
                            {formatDate(
                              employee.joiningDate,
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Actions */}
<div className="mt-4 grid grid-cols-2 gap-3">
  <button
    type="button"
    onClick={() =>
      openEditModal(employee)
    }
    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
  >
    Edit Employee
  </button>

  <button
    type="button"
    onClick={() =>
      handleToggleStatus(employee)
    }
    disabled={updating}
    className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
      employee.employeeStatus &&
      employee.userStatus
        ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
        : "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
    }`}
  >
    {employee.employeeStatus &&
    employee.userStatus
      ? "Deactivate"
      : "Activate"}
  </button>
</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold">
                  Add Employee
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Create a new employee login account.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {success}
                </div>
              )}

              {/* Name */}
              <div>
                <label
                  htmlFor="employee-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Employee Name *
                </label>

                <input
                  id="employee-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Enter employee name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Phone + Email */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="employee-phone"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Phone *
                  </label>

                  <input
                    id="employee-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm(
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="employee-email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email
                  </label>

                  <input
                    id="employee-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="employee@example.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Designation + Joining Date */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="employee-designation"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Designation
                  </label>

                  <input
                    id="employee-designation"
                    type="text"
                    value={form.designation}
                    onChange={(event) =>
                      updateForm(
                        "designation",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Sales Executive"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="employee-joining-date"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Joining Date
                  </label>

                  <input
                    id="employee-joining-date"
                    type="date"
                    value={form.joiningDate}
                    onChange={(event) =>
                      updateForm(
                        "joiningDate",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="employee-password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Initial Password *
                </label>

                <input
                  id="employee-password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateForm(
                      "password",
                      event.target.value,
                    )
                  }
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  The employee will use this password for
                  their first login.
                </p>
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="employee-address"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Address
                </label>

                <textarea
                  id="employee-address"
                  value={form.address}
                  onChange={(event) =>
                    updateForm(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="Enter employee address"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating Employee..."
                    : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Employee
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Employee ID: {editingEmployee.employeeCode}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={updating}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleEditSubmit}
              className="space-y-5 p-5"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* Employee ID */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Employee ID
                </label>

                <input
                  type="text"
                  value={editingEmployee.employeeCode}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Employee ID cannot be changed.
                </p>
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="edit-employee-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Employee Name *
                </label>

                <input
                  id="edit-employee-name"
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    updateEditForm(
                      "name",
                      event.target.value,
                    )
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Phone + Email */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-employee-phone"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Phone *
                  </label>

                  <input
                    id="edit-employee-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(event) =>
                      updateEditForm(
                        "phone",
                        event.target.value,
                      )
                    }
                    maxLength={10}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-employee-email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>

                  <input
                    id="edit-employee-email"
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      updateEditForm(
                        "email",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Designation + Joining Date */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-employee-designation"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Designation
                  </label>

                  <input
                    id="edit-employee-designation"
                    type="text"
                    value={editForm.designation}
                    onChange={(event) =>
                      updateEditForm(
                        "designation",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-employee-joining-date"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Joining Date
                  </label>

                  <input
                    id="edit-employee-joining-date"
                    type="date"
                    value={editForm.joiningDate}
                    onChange={(event) =>
                      updateEditForm(
                        "joiningDate",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="edit-employee-address"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Address
                </label>

                <textarea
                  id="edit-employee-address"
                  value={editForm.address}
                  onChange={(event) =>
                    updateEditForm(
                      "address",
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Security Information */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Security
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Employee ID, login role, password and account
                  status are managed separately and cannot be
                  changed from this form.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updating}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating
                    ? "Updating Employee..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}