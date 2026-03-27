import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeQuantityKg } from "@/lib/wasteMath";
import { SUPPORTED_ZONES } from "@/lib/locations";

const DEMO_TYPES = ["plastic", "organic"] as const;

const DEMO_COLLECTOR_NAMES = ["Ama", "Stefan"] as const;

function normalizeDisplayName(name: string | null | undefined) {
  return name?.trim().toLowerCase() ?? "";
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
      },
      { status: 500 }
    );
  }

  let tick = 0;
  try {
    const body = await req.json();
    if (
      body &&
      typeof body === "object" &&
      typeof (body as { tick?: unknown }).tick === "number" &&
      Number.isFinite((body as { tick: number }).tick)
    ) {
      tick = Math.floor((body as { tick: number }).tick);
    }
  } catch {
    // no JSON body
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: collectorProfiles, error: collectorError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("role", "collector");

  if (collectorError) {
    return NextResponse.json({ error: collectorError.message }, { status: 500 });
  }

  const profiles = (collectorProfiles ?? []) as { id: string; display_name: string | null }[];
  const byName = new Map(
    DEMO_COLLECTOR_NAMES.map((name) => {
      const match = profiles.find(
        (p) => normalizeDisplayName(p.display_name) === name.toLowerCase()
      );
      return [name, match?.id] as const;
    })
  );

  const missing = DEMO_COLLECTOR_NAMES.filter((name) => !byName.get(name));
  if (missing.length) {
    return NextResponse.json(
      {
        error: `Demo requires collector profiles with display names: ${DEMO_COLLECTOR_NAMES.join(", ")}. Missing: ${missing.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const collectorId =
    tick % 2 === 0 ? byName.get("Ama")! : byName.get("Stefan")!;

  const wasteType = DEMO_TYPES[((tick % DEMO_TYPES.length) + DEMO_TYPES.length) % DEMO_TYPES.length];
  const zone =
    SUPPORTED_ZONES[((tick % SUPPORTED_ZONES.length) + SUPPORTED_ZONES.length) % SUPPORTED_ZONES.length];
  const bucketsCount = Math.floor(6 + Math.random() * 25);
  const quantityKg = computeQuantityKg(bucketsCount, wasteType);

  const { error: insertError } = await supabase.from("waste_entries").insert({
    collector_id: collectorId,
    submitted_at: new Date().toISOString(),
    zone,
    waste_type: wasteType,
    buckets_count: bucketsCount,
    quantity_kg: quantityKg,
    status: "pending",
    photo_path: null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: 1 });
}
