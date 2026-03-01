"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";

const PLATFORM_OPTIONS = ["android_tv", "android_mobile", "all"];
const STATUS_OPTIONS = ["active", "inactive"];

function toDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function AppUpdatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);

  const [platform, setPlatform] = useState("android_tv");
  const [versionCode, setVersionCode] = useState("");
  const [versionName, setVersionName] = useState("");
  const [apkUrl, setApkUrl] = useState("");
  const [sha256, setSha256] = useState("");
  const [status, setStatus] = useState("active");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [notes, setNotes] = useState("");

  const isSuperAdmin = String(session?.role || "") === "super_admin";
  const loginUrl = (nextPath = "/updates") => `/login?next=${encodeURIComponent(nextPath)}`;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(b.version_code || 0) - Number(a.version_code || 0));
  }, [items]);

  const fetchJson = async (url, init = {}) => {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
      ...init,
    });

    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

    if (res.status === 401) {
      window.location.href = loginUrl("/updates");
      throw new Error("Unauthorized");
    }

    if (res.status === 403) {
      throw new Error("Super Admin only.");
    }

    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      const hint = data?.hint ? ` (${data.hint})` : "";
      throw new Error(`${msg}${hint}`);
    }

    return data;
  };

  const loadSession = async () => {
    const data = await fetchJson("/api/auth/me");
    const admin = data?.admin || null;
    setSession(admin);
    if (String(admin?.role || "") !== "super_admin") {
      throw new Error("Super Admin only.");
    }
  };

  const loadUpdates = async () => {
    const data = await fetchJson("/api/admin/app-updates?limit=500");
    setItems(Array.isArray(data?.updates) ? data.updates : []);
  };

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      await loadSession();
      await loadUpdates();
    } catch (e) {
      setItems([]);
      setError(e?.message || "Could not load app updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const resetForm = () => {
    setPlatform("android_tv");
    setVersionCode("");
    setVersionName("");
    setApkUrl("");
    setSha256("");
    setStatus("active");
    setForceUpdate(false);
    setNotes("");
  };

  const createUpdate = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSaving(true);
    setError("");
    try {
      await fetchJson("/api/admin/app-updates", {
        method: "POST",
        body: JSON.stringify({
          channel: "direct",
          platform,
          version_code: Number(versionCode || 0),
          version_name: versionName.trim(),
          apk_url: apkUrl.trim(),
          sha256: sha256.trim() || null,
          status,
          force_update: forceUpdate,
          notes: notes.trim() || null,
        }),
      });

      resetForm();
      await loadUpdates();
    } catch (e2) {
      setError(e2?.message || "Could not create update record.");
    } finally {
      setSaving(false);
    }
  };

  const patchUpdate = async (id, payload) => {
    await fetchJson(`/api/admin/app-updates/${encodeURIComponent(String(id))}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await loadUpdates();
  };

  const deleteUpdate = async (id) => {
    if (!isSuperAdmin) return;
    if (!window.confirm("Delete this update record?")) return;
    setSaving(true);
    setError("");
    try {
      await fetchJson(`/api/admin/app-updates/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      await loadUpdates();
    } catch (e) {
      setError(e?.message || "Could not delete update record.");
    } finally {
      setSaving(false);
    }
  };

  const quickEdit = async (item) => {
    if (!isSuperAdmin) return;

    const nextUrl = window.prompt("APK URL", item?.apk_url || "");
    if (nextUrl === null) return;

    const nextStatus = window.prompt("Status (active/inactive)", item?.status || "active");
    if (nextStatus === null) return;

    const nextForceRaw = window.prompt("Force update? (true/false)", item?.force_update ? "true" : "false");
    if (nextForceRaw === null) return;

    setSaving(true);
    setError("");
    try {
      await patchUpdate(item.id, {
        apk_url: nextUrl,
        status: String(nextStatus || "").toLowerCase() === "inactive" ? "inactive" : "active",
        force_update: String(nextForceRaw || "").toLowerCase() === "true",
      });
    } catch (e) {
      setError(e?.message || "Could not update record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar current="updates" session={session} />
        <div className="min-w-0 flex-1 space-y-6 px-8 pb-10 pt-6 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400">Admin Console</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">App Updates</h1>
          <p className="mt-1 text-sm text-slate-400">Super Admin only. Manage sideload/direct APK update records.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/70"
            disabled={loading || saving}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {!!error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {error}
        </div>
      )}

      {isSuperAdmin && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-100">Create update</div>
          <form onSubmit={createUpdate} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-300">
              <span>Channel</span>
              <input
                type="text"
                value="direct"
                disabled
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span>Platform</span>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100">
                {PLATFORM_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span>Version Code</span>
              <input type="number" min="1" required value={versionCode} onChange={(e) => setVersionCode(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100" />
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span>Version Name</span>
              <input type="text" required value={versionName} onChange={(e) => setVersionName(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100" placeholder="e.g. 2.1.0" />
            </label>

            <label className="space-y-1 text-sm text-slate-300 md:col-span-2">
              <span>APK URL</span>
              <input type="url" required value={apkUrl} onChange={(e) => setApkUrl(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100" placeholder="https://.../app-tv-release.apk" />
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span>SHA256 (optional)</span>
              <input type="text" value={sha256} onChange={(e) => setSha256(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100" maxLength={64} />
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100">
                {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>

            <label className="space-y-1 text-sm text-slate-300 md:col-span-2">
              <span>Notes / Message (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[84px] w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100" />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} />
              Force update
            </label>

            <div className="md:col-span-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
                {saving ? "Saving…" : "Create update"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
              <tr className="[&>th]:px-4 [&>th]:py-3">
                <th>ID</th>
                <th>Channel</th>
                <th>Platform</th>
                <th>Version</th>
                <th>Status</th>
                <th>Force</th>
                <th>Updated</th>
                <th>URL</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-slate-500">Loading…</td>
                </tr>
              ) : !sortedItems.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-slate-500">No update records yet.</td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr key={item.id} className="[&>td]:px-4 [&>td]:py-3 align-top">
                    <td className="text-slate-400">{item.id}</td>
                    <td>{item.channel}</td>
                    <td>{item.platform}</td>
                    <td>
                      <div className="font-semibold text-slate-100">{item.version_name}</div>
                      <div className="text-xs text-slate-500">code {item.version_code}</div>
                    </td>
                    <td>
                      <span className={item.status === "active" ? "rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200" : "rounded-full bg-slate-500/15 px-2 py-1 text-xs text-slate-300"}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.force_update ? "Yes" : "No"}</td>
                    <td className="text-xs text-slate-400">{toDateTime(item.updated_at)}</td>
                    <td className="max-w-[320px] truncate text-xs text-slate-300" title={item.apk_url}>{item.apk_url}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => quickEdit(item)}
                          disabled={!isSuperAdmin || saving}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-60"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUpdate(item.id)}
                          disabled={!isSuperAdmin || saving}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
