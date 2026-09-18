import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function AdminProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/employee");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Admin Profile
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Manage your account and password.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Account Information */}
          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              Account Information
            </h2>

            <div className="mt-6 space-y-5">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  User ID
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {user.userCode}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Role
                </p>

                <p className="mt-1 font-semibold text-blue-600">
                  ADMIN
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Account Status
                </p>

                <p className="mt-1 font-semibold text-green-600">
                  ACTIVE
                </p>
              </div>

            </div>
          </section>

          {/* Change Password */}
          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              Change Password
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update your Admin login password.
            </p>

            <div className="mt-6">
              <ChangePasswordForm />
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}