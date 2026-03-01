"use client";

import Link from "next/link";

function NavItem({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "relative flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2 font-semibold text-slate-100"
          : "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-slate-300 hover:bg-slate-800/40"
      }
    >
      {active ? <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-indigo-400" /> : null}
      <span className={active ? "text-slate-300" : "text-slate-400"}>{icon}</span>
      {label}
    </Link>
  );
}

export default function AdminSidebar({ current = "", session = null }) {
  const isSuperAdmin = String(session?.role || "") === "super_admin";
  const showResellersLink = !session || isSuperAdmin;

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-0 lg:h-screen lg:w-64">
      <div className="flex h-full flex-col border-r border-slate-800 bg-[#1f2633] px-5 py-6 text-slate-200">
        <div className="text-lg font-semibold text-slate-100">StreamIN</div>
        <div className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">Admin Console</div>

        <nav className="mt-10 flex-1 space-y-8 text-sm">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Pages</div>
            <div className="mt-4 space-y-1">
              <NavItem href="/devices" label="Devices" icon="▣" active={current === "devices"} />
              {showResellersLink ? (
                <NavItem href="/resellers" label="Resellers" icon="▤" active={current === "resellers"} />
              ) : null}
              <NavItem href="/updates" label="App Updates" icon="⬆" active={current === "updates"} />
              {isSuperAdmin ? (
                <>
                  <NavItem href="/home-ads" label="Home Ads" icon="▦" active={current === "home-ads"} />
                  <NavItem href="/notifications" label="Notifications" icon="🔔" active={current === "notifications"} />
                </>
              ) : null}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Account</div>
            <div className="mt-4 space-y-1">
              <NavItem href="/reset" label="Reset password" icon="↺" active={current === "reset"} />
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
