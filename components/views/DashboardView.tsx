"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardData } from "@/lib/adminData";
import { fetchDashboardData } from "@/lib/adminData";
import { getSupabaseClient } from "@/lib/supabaseClient";

function formatQtyKg(v: number) {
  return Number.isFinite(v) ? v.toFixed(1) : "0.0";
}

function formatEnUSDateTime(iso: string) {
  // Match the screenshot style: `1/22/2026, 2:16:40 PM`
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const d = await fetchDashboardData();
        if (!cancelled) setData(d);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        if (!cancelled) setError(reason);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("dashboard-waste-entries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waste_entries",
        },
        () => {
          if (!cancelled) {
            fetchDashboardData().then((d) => {
              if (!cancelled) setData(d);
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const bars = useMemo(() => {
    if (!data) return [];
    const rows = [...data.wasteByLocation].sort((a, b) =>
      a.zone.localeCompare(b.zone, "en", { sensitivity: "base" })
    );
    const maxKg = Math.max(...rows.map((b) => b.quantityKg), 0);
    const denom = maxKg > 0 ? maxKg : 1;
    return rows.map((b, i) => ({
      ...b,
      rank: i + 1,
      heightPct:
        b.quantityKg <= 0
          ? 0
          : Math.round((b.quantityKg / denom) * 100),
    }));
  }, [data]);

  const donut = useMemo(() => {
    if (!data) return null;
    const organicPct = Math.max(0, Math.min(100, data.composition.organicPct));
    const plasticPct = 100 - organicPct;

    // Slightly smaller radius so thicker strokes fit comfortably in the 36x36 viewBox.
    const r = 14.0;
    const circumference = 2 * Math.PI * r;
    const plasticLen = (plasticPct / 100) * circumference;
    const organicLen = (organicPct / 100) * circumference;

    return {
      r,
      circumference,
      plasticLen,
      organicLen,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <div className="text-sm text-on-surface-variant">Loading dashboard…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8 p-8">
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-ambient">
          <p className="font-headline text-lg font-bold text-on-surface">
            Dashboard error
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {error ?? "Unknown"}
          </p>
        </div>
      </div>
    );
  }

  const recentRows = data.recentSubmissions.slice(0, 4);

  return (
    <div className="space-y-8 p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-ambient">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Total Waste
          </p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface md:text-3xl">
            {formatQtyKg(data.totalWasteKg)} <span className="text-lg font-semibold">kg</span>
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">Recorded all time</p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-ambient">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Submissions
          </p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface md:text-3xl">
            {data.submissions}
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">
            Across all collectors
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-ambient">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Active Collectors
          </p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface md:text-3xl">
            {data.activeCollectors}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Currently operating
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-ambient">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Active Locations
          </p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface md:text-3xl">
            {data.activeLocations}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Live now
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-ambient lg:col-span-9 lg:min-w-0">
          <h3 className="font-headline text-lg font-bold text-on-surface">
            Waste by Location (kg)
          </h3>

          <div className="mt-8 px-1 pb-10">
            {bars.length ? (
              <div
                className="grid h-56 gap-1 sm:gap-1.5 md:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
                }}
              >
                {bars.map((b, idx) => (
                  <div
                    key={b.zone}
                    className="bar-group grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto]"
                  >
                    {/* 1fr row gets a definite height so bar % heights paint (avoid items-end / auto-height parents). */}
                    <div className="relative flex min-h-0 w-full flex-col justify-end">
                      <div className="bar-tooltip pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-[min(12rem,28vw)] -translate-x-1/2 rounded-lg bg-surface-container-lowest/90 px-2 py-1.5 text-center text-[10px] leading-tight text-on-surface shadow-ambient backdrop-blur-[12px] sm:max-w-[10rem] sm:text-xs">
                        {b.zone}: {b.quantityKg.toFixed(1)} kg
                      </div>

                      <div
                        className={
                          idx % 2 === 0
                            ? "w-full shrink-0 rounded-t-md bg-secondary transition-[height,opacity] duration-500 ease-out hover:opacity-90 sm:rounded-t-lg"
                            : "w-full shrink-0 rounded-t-md bg-primary transition-[height,opacity] duration-500 ease-out hover:opacity-90 sm:rounded-t-lg"
                        }
                        style={{
                          height:
                            b.quantityKg <= 0 ? "2px" : `${b.heightPct}%`,
                          minHeight: b.quantityKg <= 0 ? "2px" : undefined,
                          opacity: b.quantityKg <= 0 ? 0.35 : 1,
                        }}
                        role="img"
                        aria-label={`${b.zone} ${b.quantityKg.toFixed(1)} kg`}
                      />
                    </div>

                    <span className="mt-2 block shrink-0 truncate text-center text-[9px] font-medium text-on-surface-variant sm:text-[10px]">
                      {b.rank}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full text-center text-sm text-on-surface-variant">
                No submissions yet.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-outline-variant/[0.15] pt-5">
            {bars.map((b, idx) => (
              <div
                key={b.zone}
                className="flex max-w-[11rem] items-start gap-2 text-xs text-on-surface-variant sm:text-sm"
              >
                <span
                  className={
                    idx % 2 === 0
                      ? "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-secondary"
                      : "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-primary"
                  }
                  aria-hidden
                />
                <span className="leading-snug">
                  {b.rank}. {b.zone}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient lg:col-span-3 lg:min-w-0">
          <h3 className="font-headline text-base font-bold text-on-surface">
            Waste Composition (%)
          </h3>

          <div className="mx-auto mt-5 flex max-w-[220px] flex-col items-center">
            <div className="relative h-36 w-36 sm:h-40 sm:w-40">
              {donut ? (
                <svg
                  className="h-full w-full -rotate-90"
                  viewBox="0 0 36 36"
                  aria-hidden
                >
                  <circle
                    cx="18"
                    cy="18"
                    r={donut.r}
                    fill="none"
                    className="stroke-primary transition-[stroke-dasharray,stroke-dashoffset] duration-500 ease-out"
                    strokeWidth="7"
                    strokeDasharray={`${donut.plasticLen} ${donut.circumference - donut.plasticLen}`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r={donut.r}
                    fill="none"
                    className="stroke-secondary transition-[stroke-dasharray,stroke-dashoffset] duration-500 ease-out"
                    strokeWidth="7"
                    strokeDasharray={`${donut.organicLen} ${donut.circumference - donut.organicLen}`}
                    strokeDashoffset={-donut.plasticLen}
                  />
                </svg>
              ) : null}
            </div>

            <div className="mt-5 flex w-full flex-col gap-2 border-t border-outline-variant/[0.15] pt-4">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="h-2.5 w-2.5 rounded-sm bg-secondary" />
                <span>organic</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                <span>plastic</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-surface-container-lowest p-8 shadow-ambient">
        <h3 className="font-headline text-lg font-bold text-on-surface">
          Collection Trend (Last 7 Days)
        </h3>
        <div className="mt-12 flex min-h-[140px] items-center justify-center rounded-xl bg-surface-container-low px-6 py-10">
          <p className="text-sm text-on-surface-variant">No data available</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
        <div className="px-6 py-5">
          <h3 className="font-headline text-lg font-bold text-on-surface">
            Recent Submissions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Date
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Collector
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Zone
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Type
                </th>
                <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Qty
                </th>
              </tr>
            </thead>

            <tbody>
              {recentRows.map((r, idx) => {
                const date = formatEnUSDateTime(r.submitted_at);
                return (
                  <tr
                    key={r.id}
                    className={idx % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}
                  >
                    <td className="px-6 py-4 text-sm text-on-surface">{date}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-on-surface">
                        {r.collector_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-surface-container-highest px-3 py-1 text-xs font-medium text-on-surface-variant">
                        {r.zone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm lowercase text-on-surface">
                      {r.waste_type}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-on-surface">
                      {r.quantityKg.toFixed(1)}
                    </td>
                  </tr>
                );
              })}

              {!recentRows.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-sm text-on-surface-variant">
                    No submissions yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

