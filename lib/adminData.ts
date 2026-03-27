"use client";

import { computeQuantityKg, type WasteType } from "@/lib/wasteMath";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { SUPPORTED_ZONES } from "@/lib/locations";

export type WasteByLocation = {
  zone: string;
  quantityKg: number;
  rank: number;
};

export type Composition = {
  organicPct: number;
  plasticPct: number;
};

export type DashboardData = {
  totalWasteKg: number;
  submissions: number;
  activeCollectors: number;
  activeLocations: number;
  wasteByLocation: WasteByLocation[];
  composition: Composition;
  recentSubmissions: {
    id: string;
    submitted_at: string;
    collector_name: string;
    zone: string;
    waste_type: WasteType;
    buckets_count?: number;
    quantityKg: number;
    photo_path: string | null;
    status: string;
  }[];
};

type WasteEntryRow = {
  id: string;
  collector_id: string;
  submitted_at: string;
  zone: string;
  waste_type: WasteType;
  buckets_count?: number | null;
  quantity_kg?: number | null;
  photo_path: string | null;
  status: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
};

const DEFAULT_STATUS = "pending";

function formatCollectorName(profile: ProfileRow | undefined) {
  return profile?.display_name?.trim() || "Collector";
}

function computePct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  // For the demo we compute aggregates client-side. If you expect large datasets,
  // move these calculations into SQL views/RPCs.
  function qtyKgForRow(r: WasteEntryRow) {
    if (typeof r.buckets_count === "number") {
      return computeQuantityKg(r.buckets_count, r.waste_type);
    }
    return Number(r.quantity_kg ?? 0);
  }

  let rows: WasteEntryRow[] = [];
  try {
    const { data, error } = await supabase
      .from("waste_entries")
      .select(
        "id, collector_id, submitted_at, zone, waste_type, buckets_count, quantity_kg, photo_path, status"
      )
      .eq("status", DEFAULT_STATUS)
      .order("submitted_at", { ascending: false })
      .limit(5000);

    if (error) throw new Error(error.message);
    rows = (data ?? []) as unknown as WasteEntryRow[];
  } catch (err) {
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as any).message)
        : String(err);

    if (!msg.toLowerCase().includes("buckets_count")) throw err;

    // Migration hasn't been applied yet; fall back to stored quantity_kg.
    const { data, error } = await supabase
      .from("waste_entries")
      .select(
        "id, collector_id, submitted_at, zone, waste_type, quantity_kg, photo_path, status"
      )
      .eq("status", DEFAULT_STATUS)
      .order("submitted_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    rows = (data ?? []) as unknown as WasteEntryRow[];
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const totalWasteKg = rows.reduce((acc, r) => acc + qtyKgForRow(r), 0);

  const submissions = rows.length;

  const recentWeek = rows.filter((r) => {
    const t = new Date(r.submitted_at).getTime();
    return Number.isFinite(t) && t >= now - weekMs;
  });

  const activeCollectors = new Set(recentWeek.map((r) => r.collector_id)).size;
  const activeLocations = new Set(recentWeek.map((r) => r.zone)).size;

  const byZone = new Map<string, number>();
  let organicKg = 0;
  let plasticKg = 0;

  for (const r of rows) {
    const qtyKg = qtyKgForRow(r);
    byZone.set(r.zone, (byZone.get(r.zone) ?? 0) + qtyKg);
    if (r.waste_type === "organic") organicKg += qtyKg;
    if (r.waste_type === "plastic") plasticKg += qtyKg;
  }

  const wasteByLocation = SUPPORTED_ZONES.map((zone, i) => ({
    zone,
    quantityKg: byZone.get(zone) ?? 0,
    rank: i + 1,
  }));

  const plasticPct = computePct(plasticKg, totalWasteKg);
  const organicPct = totalWasteKg > 0 ? 100 - plasticPct : 0;

  const recent = rows.slice(0, 4);
  const collectorIds = [...new Set(recent.map((r) => r.collector_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", collectorIds);

  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return {
    totalWasteKg,
    submissions,
    activeCollectors,
    activeLocations,
    wasteByLocation,
    composition: {
      organicPct,
      plasticPct,
    },
    recentSubmissions: recent.map((r) => ({
      id: r.id,
      submitted_at: r.submitted_at,
      collector_name: formatCollectorName(profileById.get(r.collector_id)),
      zone: r.zone,
      waste_type: r.waste_type,
      buckets_count:
        typeof r.buckets_count === "number" ? r.buckets_count : undefined,
      quantityKg: qtyKgForRow(r),
      photo_path: r.photo_path,
      status: r.status,
    })),
  };
}

export type WasteFilters = {
  fromDate?: string;
  toDate?: string;
  zone?: string;
  wasteType?: WasteType;
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function fetchWasteEntries(
  filters: WasteFilters
): Promise<{
  rows: WasteEntryRow[];
  totalCount: number;
}> {
  const supabase = getSupabaseClient();

  const status = filters.status ?? DEFAULT_STATUS;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const from = filters.fromDate;
  const to = filters.toDate;
  const zone = filters.zone;
  const wasteType = filters.wasteType;

  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  function buildBaseQuery(includeBucketsCount: boolean) {
    let q = supabase
      .from("waste_entries")
      .select(
        includeBucketsCount
          ? "id, collector_id, submitted_at, zone, waste_type, buckets_count, quantity_kg, photo_path, status"
          : "id, collector_id, submitted_at, zone, waste_type, quantity_kg, photo_path, status"
      )
      .eq("status", status)
      .order("submitted_at", { ascending: false })
      .range(fromIdx, toIdx);

    if (from) q = q.gte("submitted_at", `${from}T00:00:00.000Z`);
    if (to) q = q.lte("submitted_at", `${to}T23:59:59.999Z`);
    if (zone && zone !== "All Locations") q = q.eq("zone", zone);
    if (wasteType) q = q.eq("waste_type", wasteType);

    return q;
  }

  try {
    const { data: rowsData, error: rowsError } = await buildBaseQuery(true);
    if (rowsError) throw new Error(rowsError.message);
    const rows = (rowsData ?? []) as unknown as WasteEntryRow[];
    return { rows, totalCount: rows.length };
  } catch (err) {
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as any).message)
        : String(err);
    if (!msg.toLowerCase().includes("buckets_count")) throw err;

    const { data: rowsData, error: rowsError } = await buildBaseQuery(false);
    if (rowsError) throw new Error(rowsError.message);
    const rows = (rowsData ?? []) as unknown as WasteEntryRow[];
    return { rows, totalCount: rows.length };
  }
}

export function deriveQuantityKgFromBuckets(
  bucketsCount: number,
  wasteType: WasteType
) {
  return computeQuantityKg(Number(bucketsCount ?? 0), wasteType);
}

