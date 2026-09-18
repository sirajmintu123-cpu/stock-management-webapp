import ChangePasswordForm from "./ChangePasswordForm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

export default async function EmployeeProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "EMPLOYEE") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/employee"
            className="mb-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Employee Dashboard
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your employee account information.
          </p>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Profile Header */}
          <div className="border-b border-slate-200 bg-slate-900 px-6 py-8">
            <div className="flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  {user.name}
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  Employee Account
                </p>
              </div>

            </div>
          </div>

          {/* Account Information */}
          <div className="p-6">

            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              Account Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Employee ID */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Employee ID
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {user.userCode}
                </p>
              </div>

              {/* Name */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Name
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {user.name}
                </p>
              </div>

              {/* Role */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Role
                </p>

                <p className="mt-1">
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    EMPLOYEE
                  </span>
                </p>
              </div>

              {/* Status */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Account Status
                </p>

                <p className="mt-1">
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    ACTIVE
                  </span>
                </p>
              </div>

            </div>

            {/* Access Information */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-bold text-amber-800">
                Employee Access
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                Your account can view products, stock
                information and stock history, and submit
                customer enquiries. Inventory changes and
                sales are managed by administrators.
              </p>
            </div>

            {/* Back */}
            <div className="mt-6">
              <Link
                href="/employee"
                className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>

          </div>
        </div>

            </div>

      <div className="mx-auto max-w-3xl">
        <ChangePasswordForm />
      </div>
    </main>
  );
}