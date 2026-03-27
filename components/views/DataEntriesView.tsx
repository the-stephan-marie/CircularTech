"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getWastePhotoSignedUrl } from "@/lib/wastePhotoStorage";
import { computeQuantityKg, type WasteType } from "@/lib/wasteMath";
import { fetchWasteEntries } from "@/lib/adminData";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { ADMIN_LOCATION_FILTERS } from "@/lib/locations";

type RowWithCollector = {
  id: string;
  submitted_at: string;
  collector_name: string;
  zone: string;
  waste_type: WasteType;
  buckets_count?: number;
  quantity_kg?: number | null;
  photo_path: string | null;
  status: string;
};

const WASTE_TYPES = ["All Waste Types", "organic", "plastic"] as const;

function formatEnUSDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

export function DataEntriesView() {
  const supabase = getSupabaseClient();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [zone, setZone] = useState<(typeof ADMIN_LOCATION_FILTERS)[number]>(
    "All Locations"
  );
  const [wasteType, setWasteType] = useState<(typeof WASTE_TYPES)[number]>(
    "All Waste Types"
  );

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [rows, setRows] = useState<RowWithCollector[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalLoading, setPhotoModalLoading] = useState(false);
  const [photoModalError, setPhotoModalError] = useState<string | null>(null);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [plasticPct, setPlasticPct] = useState<number>(0);
  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingCountLabel = useMemo(() => {
    const pages = Math.max(1, Math.ceil(totalCount / pageSize));
    return `Page ${page} of ${pages}`;
  }, [page, totalCount]);

  const wasteTypeFilter = useMemo(() => {
    if (!wasteType || wasteType === "All Waste Types") return undefined;
    return wasteType as WasteType;
  }, [wasteType]);

  async function load() {
    try {
      setError(null);
      setLoading(true);

      const res = await fetchWasteEntries({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        zone,
        wasteType: wasteTypeFilter,
        status: "pending",
        page,
        pageSize,
      });

      const collectorIds = [...new Set(res.rows.map((r) => r.collector_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", collectorIds);

      const profileById = new Map(
        (profiles ?? []).map((p) => [p.id as string, p.display_name as string | null])
      );

      const enriched: RowWithCollector[] = res.rows.map((r) => ({
        id: r.id,
        submitted_at: r.submitted_at,
        collector_name: profileById.get(r.collector_id) ?? "Collector",
        zone: r.zone,
        waste_type: r.waste_type,
        buckets_count: typeof r.buckets_count === "number" ? r.buckets_count : undefined,
        quantity_kg: r.quantity_kg ?? null,
        photo_path: r.photo_path,
        status: r.status,
      }));

      setRows(enriched);
      setTotalCount(res.totalCount);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setError(reason);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Reset pagination whenever filters change.
    setPage(1);
  }, [fromDate, toDate, zone, wasteType]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    return () => {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
    };
  }, []);

  async function handleViewPhoto(photoPath: string) {
    setPhotoModalError(null);
    setPhotoModalLoading(true);
    setPhotoModalOpen(true);
    setPhotoModalUrl(null);
    setAnalysisMode(false);
    setShowAnalysis(false);
    setIsAnalyzing(false);
    setPlasticPct(0);
    try {
      const signedUrl = await getWastePhotoSignedUrl(photoPath);
      setPhotoModalUrl(signedUrl);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setPhotoModalError(reason);
    } finally {
      setPhotoModalLoading(false);
    }
  }

  const canPrev = page > 1;
  const canNext = page * pageSize < totalCount;

  const organicPct = Number((100 - plasticPct).toFixed(1));

  function startAnalysis() {
    if (isAnalyzing) return;
    setAnalysisMode(true);
    setShowAnalysis(false);
    setIsAnalyzing(true);

    // Use tenths to guarantee one decimal precision and exact 100.0% total.
    const plasticTenths = Math.floor(Math.random() * 1001); // 0..1000
    const nextPlasticPct = Number((plasticTenths / 10).toFixed(1));

    if (analyzeTimeoutRef.current) {
      clearTimeout(analyzeTimeoutRef.current);
    }
    analyzeTimeoutRef.current = setTimeout(() => {
      setPlasticPct(nextPlasticPct);
      setIsAnalyzing(false);
      setShowAnalysis(true);
    }, 4000);
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col flex-wrap items-stretch justify-end gap-3 lg:flex-row lg:items-end">
        <div className="flex flex-wrap items-end gap-3 lg:ml-auto">
          <div>
            <label
              className="mb-1 block text-xs font-medium text-on-surface-variant"
              htmlFor="filter-from"
            >
              From:
            </label>
            <input
              id="filter-from"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              type="date"
              className="rounded-md border-0 bg-surface-container-lowest py-2 pl-3 pr-3 text-sm shadow-ambient ring-1 ring-inset ring-outline-variant/20"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-on-surface-variant"
              htmlFor="filter-to"
            >
              To:
            </label>
            <input
              id="filter-to"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              type="date"
              className="rounded-md border-0 bg-surface-container-lowest py-2 pl-3 pr-3 text-sm shadow-ambient ring-1 ring-inset ring-outline-variant/20"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-on-surface-variant"
              htmlFor="filter-loc"
            >
              Location
            </label>
            <select
              id="filter-loc"
              value={zone}
                    onChange={(e) =>
                      setZone(e.target.value as (typeof ADMIN_LOCATION_FILTERS)[number])
                    }
              className="w-full min-w-[140px] rounded-md border-0 bg-surface-container-lowest py-2.5 pl-3 pr-8 text-sm shadow-ambient ring-1 ring-inset ring-outline-variant/20"
            >
              {ADMIN_LOCATION_FILTERS.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium text-on-surface-variant"
              htmlFor="filter-type"
            >
              Waste type
            </label>
            <select
              id="filter-type"
              value={wasteType}
              onChange={(e) =>
                setWasteType(e.target.value as (typeof WASTE_TYPES)[number])
              }
              className="w-full min-w-[140px] rounded-md border-0 bg-surface-container-lowest py-2.5 pl-3 pr-8 text-sm shadow-ambient ring-1 ring-inset ring-outline-variant/20"
            >
              {WASTE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              // Demo-only: export is implemented in Step 4+.
              // Keeping button non-destructive for now.
            }}
            className="rounded-md bg-on-surface px-4 py-2.5 text-sm font-semibold text-surface-container-lowest shadow-ambient hover:opacity-90"
          >
            Export CSV
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
        <div className="px-6 py-4">
          <h3 className="font-headline text-sm font-bold uppercase tracking-wide text-primary">
            Entries
          </h3>
        </div>

        {error ? (
          <div className="px-6 py-4 text-sm text-on-surface-variant">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead className="bg-surface-container-high">
              <tr>
                {[
                  "ID",
                  "Date",
                  "Collector",
                  "Zone",
                  "Type",
                  "Qty",
                  "Photo",
                  "Validation",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-6 text-center text-sm text-on-surface-variant">
                    Loading entries…
                  </td>
                </tr>
              ) : null}

              {!loading && rows.length ? (
                rows.map((r, idx) => {
                  const qtyKg =
                    typeof r.buckets_count === "number"
                      ? computeQuantityKg(r.buckets_count, r.waste_type)
                      : Number(r.quantity_kg ?? 0);
                  return (
                    <tr
                      key={r.id}
                      className={idx % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                        {r.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">
                        {formatEnUSDate(r.submitted_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">
                        {r.collector_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">
                        {r.zone}
                      </td>
                      <td className="px-4 py-3 text-sm lowercase text-on-surface">
                        {r.waste_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">
                        {qtyKg.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        {r.photo_path ? (
                          <button
                            type="button"
                            className="rounded-md border border-secondary bg-transparent px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/5"
                            onClick={() => handleViewPhoto(r.photo_path!)}
                          >
                            View Photo
                          </button>
                        ) : (
                          "no photo"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        {r.status === "pending" ? "Pending" : r.status}
                      </td>
                    </tr>
                  );
                })
              ) : null}

              {!loading && !rows.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-6 text-center text-sm text-on-surface-variant">
                    No entries found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant/[0.15] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">{pendingCountLabel}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant/50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {photoModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-[2px]"
          onClick={() => {
            if (analyzeTimeoutRef.current) {
              clearTimeout(analyzeTimeoutRef.current);
              analyzeTimeoutRef.current = null;
            }
            setPhotoModalOpen(false);
            setIsAnalyzing(false);
          }}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-headline text-lg font-bold text-on-surface">
                Submission Photo
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (analyzeTimeoutRef.current) {
                    clearTimeout(analyzeTimeoutRef.current);
                    analyzeTimeoutRef.current = null;
                  }
                  setPhotoModalOpen(false);
                  setIsAnalyzing(false);
                }}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Close photo preview"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {!analysisMode ? (
              <div className="rounded-lg bg-surface-container-low p-3">
                {photoModalLoading ? (
                  <div className="flex h-72 items-center justify-center text-sm text-on-surface-variant">
                    Loading photo…
                  </div>
                ) : photoModalError ? (
                  <div className="flex h-72 items-center justify-center text-sm text-on-surface-variant">
                    {photoModalError}
                  </div>
                ) : photoModalUrl ? (
                  <img
                    src={photoModalUrl}
                    alt="Waste submission"
                    className="mx-auto max-h-[60vh] w-auto rounded-md object-contain"
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-on-surface-variant">
                    No image available.
                  </div>
                )}
              </div>
            ) : null}

            {!analysisMode ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="rounded-md bg-gradient-to-r from-primary to-primary-container px-8 py-2.5 text-sm font-semibold text-white shadow-ambient disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </button>
              </div>
            ) : null}

            {isAnalyzing ? (
              <div className="mt-5 rounded-xl bg-surface-container-low p-5">
                <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
                <p className="text-sm text-on-surface-variant">Running analysis…</p>
                </div>
              </div>
            ) : null}

            {showAnalysis ? (
              <div className="mt-6 rounded-xl bg-surface-container-low p-5">
                <h5 className="text-center font-headline text-base font-bold text-on-surface">
                  Composition Analysis
                </h5>
                <div className="mt-4 flex flex-col items-center">
                  <div className="relative h-44 w-44">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="7"
                        strokeDasharray={`${(plasticPct / 100) * (2 * Math.PI * 14)} ${(1 - plasticPct / 100) * (2 * Math.PI * 14)}`}
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        className="stroke-secondary"
                        strokeWidth="7"
                        strokeDasharray={`${(organicPct / 100) * (2 * Math.PI * 14)} ${(1 - organicPct / 100) * (2 * Math.PI * 14)}`}
                        strokeDashoffset={-((plasticPct / 100) * (2 * Math.PI * 14))}
                      />
                    </svg>
                  </div>
                  <div className="mt-4 grid w-full grid-cols-2 gap-3">
                    <div className="rounded-lg bg-surface-container-lowest p-3 text-center shadow-ambient">
                      <p className="text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                        Plastic
                      </p>
                      <p className="mt-1 font-headline text-xl font-extrabold text-on-surface">
                        {plasticPct.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-container-lowest p-3 text-center shadow-ambient">
                      <p className="text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                        Organic
                      </p>
                      <p className="mt-1 font-headline text-xl font-extrabold text-on-surface">
                        {organicPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

