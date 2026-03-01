/** =========================================
 *  PAGE: Password Reset Request
 *  ========================================= */
"use client";

import { useState } from "react";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
        cache: "no-store",
      });
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && (data.error || data.message)
            ? String(data.error || data.message)
            : "Reset request failed.";
        setStatus({ type: "error", message: msg });
        return;
      }

      setStatus({ type: "success", message: "If the email exists, a reset link was sent." });
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Reset request failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
              <p className="mt-1 text-sm text-slate-300">We’ll email you a reset link.</p>
            </div>

            {status.message && (
              <div
                className={
                  status.type === "error"
                    ? "mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                    : "mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
                }
              >
                {status.message}
              </div>
            )}

            <form onSubmit={submit} className="grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm text-slate-200">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-11 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-600 font-medium text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 active:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            <a href="/login" className="hover:text-slate-300">Back to login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
