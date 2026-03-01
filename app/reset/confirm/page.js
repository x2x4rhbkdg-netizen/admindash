/** =========================================
 *  PAGE: Password Reset Confirm
 *  ========================================= */
"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetConfirmForm() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!token) {
      setStatus({ type: "error", message: "Missing reset token." });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, password }),
        cache: "no-store",
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && (data.error || data.message)
            ? String(data.error || data.message)
            : "Reset failed.";
        setStatus({ type: "error", message: msg });
        return;
      }

      setStatus({ type: "success", message: "Password updated. You can sign in now." });
      setPassword("");
      setConfirm("");
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Reset failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-xl backdrop-blur sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-slate-300">Choose a strong password.</p>
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
          <span className="text-sm text-slate-200">New password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            required
            className="h-11 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-200">Confirm password</span>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            placeholder="••••••••"
            required
            className="h-11 w-full rounded-xl border border-slate-700/70 bg-slate-950/40 px-3 text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-600 font-medium text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 active:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetConfirmPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-xl backdrop-blur sm:p-8">
                <div className="h-6 w-40 rounded bg-slate-800/60 animate-pulse" />
                <div className="mt-3 h-4 w-64 rounded bg-slate-800/60 animate-pulse" />
                <div className="mt-6 h-11 w-full rounded bg-slate-800/60 animate-pulse" />
                <div className="mt-3 h-11 w-full rounded bg-slate-800/60 animate-pulse" />
                <div className="mt-4 h-11 w-full rounded bg-slate-800/60 animate-pulse" />
              </div>
            }
          >
            <ResetConfirmForm />
          </Suspense>

          <div className="mt-4 text-center text-xs text-slate-500">
            <a href="/login" className="hover:text-slate-300">Back to login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
