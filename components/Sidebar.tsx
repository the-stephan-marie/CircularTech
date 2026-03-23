"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/users", label: "User Management", icon: "manage_accounts" },
  { href: "/data", label: "Data Entries", icon: "description" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-surface-container-lowest p-4 shadow-ambient"
      aria-label="Main navigation"
    >
      <div className="mb-8 flex items-center justify-between gap-2 px-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="material-symbols-outlined shrink-0 text-[28px] text-primary"
            aria-hidden
          >
            recycling
          </span>
          <span className="truncate font-headline text-lg font-extrabold tracking-tight text-on-surface">
            CircularTech
          </span>
        </div>
        <button
          type="button"
          className="hidden rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low sm:inline-flex"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-xl">menu_open</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1" id="main-nav">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "nav-item flex items-center gap-3 rounded-full bg-primary-fixed px-4 py-3 font-headline text-sm font-semibold text-on-primary-fixed transition-colors"
                  : "nav-item flex items-center gap-3 rounded-full px-4 py-3 font-headline text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
              }
              aria-current={active ? "page" : undefined}
            >
              <span className="material-symbols-outlined text-[22px]">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-3 py-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold tracking-tight text-on-primary-fixed"
            aria-hidden
          >
            AD
          </div>
          <div className="min-w-0">
            <p className="truncate font-headline text-sm font-semibold text-on-surface">
              Admin Default
            </p>
            <p className="truncate text-xs text-on-surface-variant">
              admin@goto.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
