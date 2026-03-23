"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";

export async function getWastePhotoSignedUrl(
  photoPath: string,
  expiresInSeconds = 60 * 5
) {
  // Creates a short-lived signed URL for private bucket access.
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from("waste-photos")
    .createSignedUrl(photoPath, expiresInSeconds);

  if (error) throw error;
  if (!data?.signedUrl) throw new Error("No signedUrl returned from storage.");
  return data.signedUrl;
}

