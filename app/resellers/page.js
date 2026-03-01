/** =========================================
 *  PAGE: Resellers (super admin)
 *  ========================================= */
"use client";

import { useEffect, useMemo, useState } from "react";

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{label}</div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400">Admin</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-100">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-200 hover:bg-slate-900/70"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export default function ResellersPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminSession, setAdminSession] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formRole, setFormRole] = useState("reseller");
  const [formPassword, setFormPassword] = useState("");

  const [statusSaving, setStatusSaving] = useState({});
  const [resetSaving, setResetSaving] = useState({});
  const [roleSaving, setRoleSaving] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2400);
  };

  const loginUrl = (nextPath = "/resellers") => `/login?next=${encodeURIComponent(nextPath)}`;

  const handleUnauthorized = (ctx = "Request") => {
    setError(`${ctx}: Unauthorized. Please login again.`);
    try {
      window.location.href = loginUrl("/resellers");
    } catch (_) {}
  };

  const doLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }).catch(() => null);
    } finally {
      try {
        window.location.href = loginUrl("/");
      } catch (_) {}
    }
  };

  const loadAdminSession = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (data?.admin) setAdminSession(data.admin);
    } catch (_) {}
  };

  const loadAdmins = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        handleUnauthorized("Load admins");
        return;
      }

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && (data.error || data.message)
            ? String(data.error || data.message)
            : "Could not load admins.";
        throw new Error(msg);
      }

      setAdmins(Array.isArray(data?.admins) ? data.admins : []);
    } catch (e) {
      setError(e?.message || "Could not load admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminSession();
    loadAdmins();
  }, []);

  const resellerList = useMemo(
    () => admins.filter((a) => a.role !== "super_admin"),
    [admins]
  );

  const stats = {
    total: resellerList.length,
    active: resellerList.filter((a) => a.status === "active").length,
    disabled: resellerList.filter((a) => a.status === "disabled").length,
  };

  const openCreate = () => {
    setFormName("");
    setFormEmail("");
    setFormUsername("");
    setFormRole("reseller");
    setFormPassword("");
    setCreateError("");
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (createSaving) return;
    setCreateOpen(false);
    setCreateError("");
  };

  const createAdmin = async () => {
    setCreateSaving(true);
    setCreateError("");
    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim(),
        username: formUsername.trim(),
        role: formRole,
        password: formPassword,
      };

      const res = await fetch("/api/admin/admins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (res.status === 401) {
        handleUnauthorized("Create admin");
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && (data.error || data.message)
            ? String(data.error || data.message)
            : "Create admin failed.";
        throw new Error(`${msg} (HTTP ${res.status})`);
      }

      setCreateOpen(false);
      showToast("Admin created.");
      await loadAdmins();
    } catch (e) {
      setCreateError(e?.message || "Could not create admin.");
    } finally {
      setCreateSaving(false);
    }
  };

  const toggleStatus = async (admin) => {
    const nextStatus = admin.status === "active" ? "disabled" : "active";
    setStatusSaving((prev) => ({ ...prev, [admin.id]: true }));
    try {
      const res = await fetch(`/api/admin/admins/${encodeURIComponent(admin.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ status: nextStatus }),
        cache: "no-store",
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (res.status === 401) {
        handleUnauthorized("Update admin");
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && (data.error || data.message)
            ? String(data.error || data.message)
            : "Update failed.";
        throw new Error(`${msg} (HTTP ${res.status})`);
      }

      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, status: nextStatus } : a))
      );
      showToast(`Admin ${nextStatus}.`);
    } catch (e) {
      showToast(e?.message || "Update failed.", "error");
    } finally {
      setStatusSaving((prev) => ({ ...prev, [admin.id]: false }));
    }
  };

  const updateRole = async (admin, nextRole) => {
    if (!nextRole || admin.role === nextRole) return;
    setRoleSaving((prev) => ({ ...prev, [admin.id]: true }));
    try {
      const res = await fetch(`/api/admin/admins/${encodeURIComponent(admin.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ role: nextRole }),
        cache: "no-store",
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (res.status === 401) {
        handleUnauthorized("Update role");
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && (data.error || data.message)
            ? String(data.error || data.message)
            : "Update failed.";
        throw new Error(`${msg} (HTTP ${res.status})`);
      }

      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, role: nextRole } : a))
      );
      showToast("Role updated.");
    } catch (e) {
      showToast(e?.message || "Update failed.", "error");
    } finally {
      setRoleSaving((prev) => ({ ...prev, [admin.id]: false }));
    }
  };

  const sendReset = async (admin) => {
    setResetSaving((prev) => ({ ...prev, [admin.id]: true }));
    try {
      const res = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: admin.email }),
        cache: "no-store",
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && (data.error || data.message)
            ? String(data.error || data.message)
            : "Reset failed.";
        throw new Error(`${msg} (HTTP ${res.status})`);
      }

      showToast("Reset email sent.");
    } catch (e) {
      showToast(e?.message || "Reset failed.", "error");
    } finally {
      setResetSaving((prev) => ({ ...prev, [admin.id]: false }));
    }
  };

  const isSuperAdmin = adminSession?.role === "super_admin";
  const showResellersLink = !adminSession || isSuperAdmin;
  const profileName = adminSession?.name || adminSession?.username || "Profile";
  const profileRole = adminSession?.role || "admin";
  const lastLoadOk = !loading && !error;

  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full shrink-0 lg:sticky lg:top-0 lg:h-screen lg:w-64">
          <div className="flex h-full flex-col border-r border-slate-800 bg-[#1f2633] px-5 py-6 text-slate-200">
            <div className="text-lg font-semibold text-slate-100">StreamIN</div>
            <div className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">Admin Console</div>

            <nav className="mt-10 flex-1 space-y-8 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Layouts & Pages</div>
                <div className="mt-4 space-y-1">
                  <a
                    href="/devices"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-slate-300 hover:bg-slate-800/40"
                  >
                    <span className="text-slate-400">▣</span>
                    Devices
                  </a>

                  {showResellersLink && (
                    <a
                      href="/resellers"
                      className="relative flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2 font-semibold text-slate-100"
                    >
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-indigo-400" />
                      <span className="text-slate-300">▤</span>
                      Resellers
                    </a>
                  )}

                  {isSuperAdmin && (
                    <>
                      <a
                        href="/updates"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-slate-300 hover:bg-slate-800/40"
                      >
                        <span className="text-slate-400">⬆</span>
                        App Updates
                      </a>
                      <a
                        href="/home-ads"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-slate-300 hover:bg-slate-800/40"
                      >
                        <span className="text-slate-400">▦</span>
                        Home Ads
                      </a>
                      <a
                        href="/notifications"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-slate-300 hover:bg-slate-800/40"
                      >
                        <span className="text-slate-400">🔔</span>
                        Notifications
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Account</div>
                <div className="mt-4 space-y-1">
                  <a
                    href="/reset"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-slate-300 hover:bg-slate-800/40"
                  >
                    <span className="text-slate-400">↺</span>
                    Reset password
                  </a>
                </div>
              </div>
            </nav>

            {isSuperAdmin && (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={openCreate}
                  className="flex w-full items-center gap-3 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  <span className="text-white">⬇</span>
                  Add Admin/Reseller
                </button>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6 px-8 pb-10 pt-6 lg:px-10">
      {toast.visible && (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={
              toast.type === "success"
                ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-lg"
                : "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg"
            }
          >
            {toast.message}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400">Admin Console</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Resellers</h1>
          <p className="mt-1 text-sm text-slate-400">Manage admin and reseller accounts</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={
              lastLoadOk
                ? "inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
                : "inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-500/20"
            }
          >
            {lastLoadOk ? "API connected" : loading ? "Connecting" : "API error"}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900/70"
            >
              <span className="max-w-[140px] truncate">{profileName}</span>
              <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[11px] text-slate-300">
                {profileRole}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
                <div className="border-b border-slate-800 px-4 py-3">
                  <div className="text-xs uppercase tracking-widest text-slate-500">Profile</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">{profileName}</div>
                </div>
                <div className="space-y-2 px-4 py-3 text-xs text-slate-300">
                  <div>
                    <div className="text-slate-500">Role</div>
                    <div className="text-slate-100">{profileRole}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Email</div>
                    <div className="text-slate-100">{adminSession?.email || "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Username</div>
                    <div className="text-slate-100">{adminSession?.username || "—"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={doLogout}
            className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900/70"
          >
            Logout
          </button>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Super admin access required.
        </div>
      )}

      {!!error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <div className="font-semibold">Could not load admins.</div>
          <div className="mt-1 opacity-90">{error}</div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total admins" value={loading ? "—" : stats.total} icon="▦" />
        <StatCard label="Active" value={loading ? "—" : stats.active} icon="⚡" />
        <StatCard label="Disabled" value={loading ? "—" : stats.disabled} icon="⛔" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="[&>td]:px-4 [&>td]:py-3">
                      <td colSpan={8}>
                        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-950/40" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {!loading && resellerList.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-slate-800 transition odd:bg-slate-950 even:bg-slate-900/30 hover:bg-slate-900/60 [&>td]:px-4 [&>td]:py-3"
                >
                  <td className="font-semibold text-slate-100">{a.name || "—"}</td>
                  <td className="text-slate-200">{a.email || "—"}</td>
                  <td className="text-slate-200">{a.username || "—"}</td>
                  <td className="text-slate-200">
                    {isSuperAdmin ? (
                      <select
                        value={a.role}
                        onChange={(e) => updateRole(a, e.target.value)}
                        disabled={roleSaving[a.id] || a.id === adminSession?.admin_id}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-100 outline-none focus:ring-2 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="reseller">reseller</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    ) : (
                      a.role
                    )}
                  </td>
                  <td className="text-slate-200">{a.status}</td>
                  <td className="text-slate-200">{a.last_login_at || "—"}</td>
                  <td className="text-slate-200">{a.created_at || "—"}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStatus(a)}
                        disabled={statusSaving[a.id]}
                        className="inline-flex items-center rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 ring-1 ring-inset ring-amber-500/30 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {a.status === "active" ? "Disable" : "Enable"}
                      </button>

                      <button
                        type="button"
                        onClick={() => sendReset(a)}
                        disabled={resetSaving[a.id]}
                        className="inline-flex items-center rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200 ring-1 ring-inset ring-sky-500/30 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resetSaving[a.id] ? "Sending…" : "Reset"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && resellerList.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-sm font-semibold text-slate-200">No resellers yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={createOpen} title="Create Reseller" onClose={closeCreate}>
        <div className="space-y-5">
          {!!createError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {createError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" hint="Optional">
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-700"
                placeholder="Reseller name"
              />
            </Field>

            <Field label="Role" hint="super_admin/admin/reseller">
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-slate-700"
              >
                <option value="reseller">reseller</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </Field>

            <Field label="Email" hint="Required">
              <input
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-700"
                placeholder="email@example.com"
              />
            </Field>

            <Field label="Username" hint="Optional">
              <input
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-700"
                placeholder="username"
              />
            </Field>

            <Field label="Password" hint="Min 8 chars">
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-700"
                placeholder="••••••••"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={closeCreate}
              disabled={createSaving}
              className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createAdmin}
              disabled={createSaving}
              className="inline-flex items-center rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createSaving ? "Creating…" : "Create admin"}
            </button>
          </div>
        </div>
      </Modal>
        </div>
      </div>
    </div>
  );
}
