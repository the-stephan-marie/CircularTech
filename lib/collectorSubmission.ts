"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";
import { computeQuantityKg } from "@/lib/wasteMath";

export type WasteType = "plastic" | "organic";

type SubmitWasteEntryInput = {
  wasteType: WasteType;
  buckets: number;
  zone: string;
  photoFile?: File | null;
};

const KG_PER_BUCKET: Record<WasteType, number> = {
  plastic: 0.5,
  organic: 0.4,
};

export async function ensureCollectorSession() {
  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;

  // This demo expects email/password login (admin-created accounts).
  // If the user is not authenticated, we must not try to create an anonymous session
  // because RLS policies rely on `auth.uid()` being present.
  if (!user) {
    throw new Error(
      "You must be logged in to submit waste entries. Please sign in."
    );
  }

  return user;
}

async function uploadWastePhoto(userId: string, file: File) {
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("waste-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function submitWasteEntry(input: SubmitWasteEntryInput) {
  const supabase = getSupabaseClient();
  const user = await ensureCollectorSession();

  const quantityKg = computeQuantityKg(input.buckets, input.wasteType);

  let photoPath: string | null = null;
  if (input.photoFile) {
    photoPath = await uploadWastePhoto(user.id, input.photoFile);
  }

  const { error } = await supabase.from("waste_entries").insert({
    collector_id: user.id,
    zone: input.zone,
    waste_type: input.wasteType,
    buckets_count: input.buckets,
    quantity_kg: quantityKg,
    photo_path: photoPath,
    status: "pending",
  });
  if (error) throw error;

  return { quantityKg };
}

export async function getCollectorHistory() {
  const supabase = getSupabaseClient();
  const user = await ensureCollectorSession();
  const { data, error } = await supabase
    .from("waste_entries")
    .select("id, submitted_at, zone, waste_type, quantity_kg, status")
    .eq("collector_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

