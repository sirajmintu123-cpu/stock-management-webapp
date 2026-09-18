"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [userCode, setUserCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userCode,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Login failed.");
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/employee");
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#07111f] text-white">

      {/* Background ambient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6">

        {/* Main container */}
        <div className="w-full max-w-[1050px]">

          <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">

            {/* =========================
                LEFT BRAND PANEL
            ========================== */}
            <section className="relative hidden min-h-[650px] overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between">

              {/* Decorative circles */}
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/5" />

              <div>
                {/* Brand */}
                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-xl">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-cyan-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 7.5 12 3l8 4.5-8 4.5L4 7.5Z" />
                      <path d="M4 12.5 12 17l8-4.5" />
                      <path d="M4 17 12 21l8-4" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-cyan-300">
                      INVENTORY
                    </p>
                    <p className="text-xs font-medium tracking-[0.2em] text-white/45">
                      MANAGEMENT SYSTEM
                    </p>
                  </div>
                </div>

                {/* Main message */}
                <div className="mt-24 max-w-md">

                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
                    Secure Business Workspace
                  </div>

                  <h2 className="text-4xl font-bold leading-[1.12] tracking-tight text-white xl:text-5xl">
                    Manage your
                    <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                      inventory smarter.
                    </span>
                  </h2>

                  <p className="mt-6 max-w-sm text-sm leading-7 text-white/50">
                    A centralized workspace for products, stock,
                    customers, enquiries, sales and employee operations.
                  </p>
                </div>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-3 gap-3">

                <Feature
                  icon="box"
                  title="Inventory"
                  text="Real-time stock"
                />

                <Feature
                  icon="users"
                  title="Customers"
                  text="Manage enquiries"
                />

                <Feature
                  icon="chart"
                  title="Sales"
                  text="Track business"
                />

              </div>
            </section>

            {/* =========================
                RIGHT LOGIN PANEL
            ========================== */}
            <section className="flex min-h-[650px] items-center justify-center bg-[#0b1626]/70 px-6 py-10 sm:px-10 lg:px-12">

              <div className="w-full max-w-[390px]">

                {/* Mobile brand */}
                <div className="mb-10 flex items-center justify-center lg:hidden">
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 text-cyan-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M4 7.5 12 3l8 4.5-8 4.5L4 7.5Z" />
                        <path d="M4 12.5 12 17l8-4.5" />
                        <path d="M4 17 12 21l8-4" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-bold tracking-wider">
                        INVENTORY
                      </p>
                      <p className="text-[10px] tracking-[0.18em] text-white/40">
                        MANAGEMENT SYSTEM
                      </p>
                    </div>

                  </div>
                </div>

                {/* Login heading */}
                <div className="mb-8">

                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Welcome back
                  </p>

                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Sign in
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    Enter your credentials to access your workspace.
                  </p>

                </div>

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* User ID */}
                  <div>

                    <label
                      htmlFor="userCode"
                      className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-white/55"
                    >
                      User ID
                    </label>

                    <div className="group relative">

                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition group-focus-within:text-cyan-300">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M20 21a8 8 0 0 0-16 0" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>

                      <input
                        id="userCode"
                        type="text"
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value)}
                        placeholder="Enter your User ID"
                        autoComplete="username"
                        required
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/25 hover:border-white/20 focus:border-cyan-400/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-cyan-400/5"
                      />

                    </div>
                  </div>

                  {/* Password */}
                  <div>

                    <div className="mb-2.5 flex items-center justify-between">

                      <label
                        htmlFor="password"
                        className="text-xs font-semibold uppercase tracking-wider text-white/55"
                      >
                        Password
                      </label>

                    </div>

                    <div className="group relative">

                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition group-focus-within:text-cyan-300">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <rect
                            x="4"
                            y="10"
                            width="16"
                            height="11"
                            rx="2"
                          />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                      </div>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-12 pr-12 text-sm text-white outline-none transition-all placeholder:text-white/25 hover:border-white/20 focus:border-cyan-400/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-cyan-400/5"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
                      >
                        {showPassword ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M3 3l18 18" />
                            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                            <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.8 6a11.7 11.7 0 0 1-3.1 3.4" />
                            <path d="M6.2 6.2C4.5 7.3 3.2 8.8 2.2 10c1.3 2 4.8 6 9.8 6 1.1 0 2.1-.2 3-.5" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M2.2 12s3.5-6 9.8-6 9.8 6 9.8 6-3.5 6-9.8 6-9.8-6-9.8-6Z" />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
                        )}
                      </button>

                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300">

                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-5 w-5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>

                      <span>{error}</span>

                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-2 flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >

                    <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />

                    {loading ? (
                      <span className="relative flex items-center gap-2">
                        <svg
                          className="h-5 w-5 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            className="opacity-30"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            d="M21 12a9 9 0 0 0-9-9"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      <span className="relative flex items-center gap-2">
                        Sign in
                        <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    )}

                  </button>

                </form>

                {/* Security message */}
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/30">

                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  Secure access to your business workspace

                </div>

              </div>

            </section>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-white/25">
            © {new Date().getFullYear()} Inventory Management System
            <span className="mx-2">•</span>
            Secure Business Platform
          </p>

        </div>
      </div>
    </main>
  );
}


/* =========================================
   FEATURE COMPONENT
========================================= */

function Feature({
  icon,
  title,
  text,
}: {
  icon: "box" | "users" | "chart";
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/[0.06]">

      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-300">

        {icon === "box" && (
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="M4 7.5 12 12l8-4.5" />
            <path d="M12 12v9" />
          </svg>
        )}

        {icon === "users" && (
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            <path d="M15 5.5a3 3 0 0 1 0 5.8" />
            <path d="M16 14.5a5 5 0 0 1 4.5 5.5" />
          </svg>
        )}

        {icon === "chart" && (
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 15 3-4 3 2 5-6" />
          </svg>
        )}

      </div>

      <p className="text-xs font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-white/35">
        {text}
      </p>

    </div>
  );
}