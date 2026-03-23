"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";

export type CollectorRow = {
  userId: string;
  name: string;
  phoneNumber: string;
  status: string;
};

export async function fetchCollectorsForUserManagement(): Promise<CollectorRow[]> {
  const supabase = getSupabaseClient();

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, role, phone_number")
    .eq("role", "collector");
  if (profilesError) throw profilesError;

  const profiles = (profilesData ?? []) as {
    id: string;
    display_name: string | null;
    role: string;
    phone_number: string | null;
  }[];

  const collectorIds = profiles.map((p) => p.id);
  const { data: collectorsData, error: collectorsError } = await supabase
    .from("collectors")
    .select("user_id, status, phone_number")
    .in("user_id", collectorIds.length ? collectorIds : ["00000000-0000-0000-0000-000000000000"]);
  if (collectorsError) throw collectorsError;

  const collectors = (collectorsData ?? []) as {
    user_id: string;
    status: string;
    phone_number: string | null;
  }[];

  const collectorById = new Map(collectors.map((c) => [c.user_id, c]));

  return profiles
    .map((p) => {
      const c = collectorById.get(p.id);
      return {
        userId: p.id,
        name: p.display_name?.trim() || "Collector",
        phoneNumber: c?.phone_number ?? p.phone_number ?? "-",
        status: c?.status ?? "active",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

