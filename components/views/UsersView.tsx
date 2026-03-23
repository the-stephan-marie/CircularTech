"use client";

import { useEffect, useState } from "react";
import {
  fetchCollectorsForUserManagement,
  type CollectorRow,
} from "@/lib/adminUsers";

export function UsersView() {
  const [collectors, setCollectors] = useState<CollectorRow[]>([]);
  const [loadingCollectors, setLoadingCollectors] = useState(true);
  const [collectorError, setCollectorError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCollectors() {
      try {
        setCollectorError(null);
        setLoadingCollectors(true);
        const rows = await fetchCollectorsForUserManagement();
        if (!cancelled) setCollectors(rows);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        if (!cancelled) setCollectorError(reason);
      } finally {
        if (!cancelled) setLoadingCollectors(false);
      }
    }
    loadCollectors();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <label className="sr-only" htmlFor="role-filter">
          Filter by role
        </label>
        <select
          id="role-filter"
          className="rounded-md border-0 bg-surface-container-lowest py-2.5 pl-3 pr-10 text-sm text-on-surface shadow-ambient ring-1 ring-inset ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
        >
          <option>All Roles</option>
          <option>Admin</option>
          <option>Collector</option>
        </select>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary to-primary-container px-4 py-2.5 text-sm font-semibold text-white shadow-ambient transition-opacity hover:opacity-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add User
        </button>
      </div>

      <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
        <div className="px-6 py-4">
          <h3 className="font-headline text-sm font-bold uppercase tracking-wide text-primary">
            Staff
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Name
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Role
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Email
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Status
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-surface-container-lowest">
                <td className="px-6 py-4 text-sm font-medium text-on-surface">
                  Admin Default
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-surface-container-highest px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    Admin
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">
                  admin@goto.com
                </td>
                <td className="px-6 py-4 text-sm font-medium text-primary">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                  Active
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
                    aria-label="Row actions"
                  >
                    <span className="material-symbols-outlined text-xl">
                      more_horiz
                    </span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-outline-variant/[0.15] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">Page 1 of 1</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="rounded-md bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant/50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled
              className="rounded-md bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant/50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
        <div className="px-6 py-4">
          <h3 className="font-headline text-sm font-bold uppercase tracking-wide text-primary">
            Collectors
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Name
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Phone Number
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Status
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingCollectors ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm text-on-surface-variant"
                  >
                    Loading collectors…
                  </td>
                </tr>
              ) : null}

              {!loadingCollectors && collectorError ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm text-on-surface-variant"
                  >
                    {collectorError}
                  </td>
                </tr>
              ) : null}

              {!loadingCollectors && !collectorError && collectors.length
                ? collectors.map((c, i) => (
                    <tr
                      key={c.userId}
                      className={
                        i % 2 === 0
                          ? "bg-surface-container-lowest"
                          : "bg-surface"
                      }
                    >
                      <td className="px-6 py-4 text-sm font-medium text-on-surface">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {c.phoneNumber}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />{" "}
                        {c.status === "active" ? "Active" : c.status}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
                          aria-label="Row actions"
                        >
                          <span className="material-symbols-outlined text-xl">
                            more_horiz
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                : null}

              {!loadingCollectors && !collectorError && !collectors.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm text-on-surface-variant"
                  >
                    No collectors found in Supabase.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
