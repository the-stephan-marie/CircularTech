"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ensureCollectorSession,
  getCollectorHistory,
  submitWasteEntry,
  type WasteType,
} from "@/lib/collectorSubmission";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Tab = "entry" | "history" | "profile";

const ZONES = ["Rawlings park", "GSL"] as const;

export function CollectorApp() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [tab, setTab] = useState<Tab>("entry");
  const [wasteType, setWasteType] = useState<WasteType>("plastic");
  const [buckets, setBuckets] = useState(3);
  const [zone, setZone] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState<
    {
      id: string;
      submitted_at: string;
      zone: string;
      waste_type: string;
      quantity_kg: number;
      status: string;
    }[]
  >([]);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const photoLabel = useMemo(
    () => (photoFile ? `Selected: ${photoFile.name}` : "Upload evidence"),
    [photoFile]
  );

  async function onSubmitEntry() {
    setMessage("");
    if (!zone) {
      setMessage("Please select a location.");
      return;
    }

    setLoading(true);
    try {
      await ensureCollectorSession();
      const result = await submitWasteEntry({
        wasteType,
        buckets,
        zone,
        photoFile,
      });
      setPhotoFile(null);
      setMessage(
        `Entry submitted. ${result.quantityKg}kg recorded (${buckets} bucket${
          buckets > 1 ? "s" : ""
        }).`
      );
      setTab("history");
      await loadHistory();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setMessage(`Failed to submit entry: ${reason}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const rows = await getCollectorHistory();
      setHistoryRows(rows);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setMessage(`Failed to load history: ${reason}`);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function onOpenHistory() {
    setTab("history");
    if (!historyRows.length) await loadHistory();
  }

  async function onLogout() {
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setMessage(`Unable to sign out: ${reason}`);
    }
  }

  async function loadProfile() {
    try {
      const user = await ensureCollectorSession();
      const email = user.email ?? "";
      setProfileEmail(email);

      // Demo override requested: fixed read-only number for this account.
      if (email.toLowerCase() === "stefan@avec.digital") {
        setProfilePhone("0234567890");
      }
      setProfilePhone(
        typeof user.user_metadata?.phone_number === "string"
          ? user.user_metadata.phone_number
          : ""
      );
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone_number")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      setProfileDisplayName(data?.display_name ?? "");
      setProfilePhone(
        email.toLowerCase() === "stefan@avec.digital"
          ? "0234567890"
          : (data?.phone_number ?? "")
      );
      setProfileLoaded(true);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setMessage(`Failed to load profile: ${reason}`);
    }
  }

  async function onSaveProfile() {
    setProfileSaving(true);
    setMessage("");
    try {
      const user = await ensureCollectorSession();
      const normalizedDisplayName = profileDisplayName.trim() || null;
      const normalizedPhone = profilePhone.trim() || null;

      // Use upsert so profile values are persisted even if a row was missing.
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          display_name: normalizedDisplayName,
          phone_number: normalizedPhone,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      setMessage("Profile updated.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setMessage(`Unable to save profile: ${reason}`);
    } finally {
      setProfileSaving(false);
    }
  }

  useEffect(() => {
    if (tab === "profile" && !profileLoaded) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profileLoaded]);

  return (
    <div className="min-h-[100dvh] bg-background text-on-background">
      <header className="fixed top-0 z-50 w-full border-b border-outline-variant/15 bg-surface-container-lowest/90 backdrop-blur-[12px]">
        <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-primary"
              aria-hidden
            >
              recycling
            </span>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
              Waste Entry
            </h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="transition-opacity hover:opacity-75"
            aria-label="Sign out"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              logout
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 pb-28 pt-20">
        {tab === "entry" ? (
          <section className="space-y-7">
            <div>
              <h2 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">
                New Entry
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Log your environmental impact today.
              </p>
            </div>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                What did you collect?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setWasteType("plastic")}
                  className={
                    wasteType === "plastic"
                      ? "group flex flex-col items-center justify-center rounded-xl border-2 border-primary-container/20 bg-surface-container-lowest p-6 shadow-ambient transition-all"
                      : "group flex flex-col items-center justify-center rounded-xl border-2 border-transparent bg-surface-container-lowest p-6 shadow-ambient transition-all hover:border-primary-container/20"
                  }
                >
                  <div
                    className={
                      wasteType === "plastic"
                        ? "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"
                        : "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container"
                    }
                  >
                    <span className="material-symbols-outlined text-primary">
                      delete
                    </span>
                  </div>
                  <span className="font-headline text-3xl font-bold text-on-surface">
                    plastic
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWasteType("organic")}
                  className={
                    wasteType === "organic"
                      ? "group flex flex-col items-center justify-center rounded-xl border-2 border-primary-container/20 bg-surface-container-lowest p-6 shadow-ambient transition-all"
                      : "group flex flex-col items-center justify-center rounded-xl border-2 border-transparent bg-surface-container-lowest p-6 shadow-ambient transition-all hover:border-primary-container/20"
                  }
                >
                  <div
                    className={
                      wasteType === "organic"
                        ? "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"
                        : "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container"
                    }
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">
                      compost
                    </span>
                  </div>
                  <span className="font-headline text-3xl font-bold text-on-surface">
                    organic
                  </span>
                </button>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                How much (Buckets)?
              </h3>
              <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
                <button
                  type="button"
                  onClick={() => setBuckets((v) => Math.max(1, v - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container text-on-surface transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-headline text-6xl font-extrabold text-on-surface">
                    {buckets}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                    Buckets
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBuckets((v) => Math.min(99, v + 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-ambient transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                Location
              </h3>
              <div className="rounded-xl bg-surface-container-lowest px-4 py-3 shadow-ambient">
                <label className="sr-only" htmlFor="collector-zone">
                  Select location
                </label>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    location_on
                  </span>
                  <select
                    id="collector-zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full border-0 bg-transparent px-0 py-1 text-base text-on-surface focus:ring-0"
                  >
                    <option value="" disabled>
                      Tap to select
                    </option>
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                Photo (Optional)
              </h3>
              <label
                htmlFor="collector-photo"
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low transition-colors hover:bg-surface-container-lowest"
              >
                <span className="material-symbols-outlined mb-1 text-3xl text-on-surface-variant">
                  add_a_photo
                </span>
                <span className="text-xs text-on-surface-variant">{photoLabel}</span>
              </label>
              <input
                id="collector-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </section>

            <button
              type="button"
              onClick={onSubmitEntry}
              disabled={loading}
              className="mb-4 w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 font-headline text-lg font-bold text-white shadow-ambient transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Entry"}
            </button>

            {message ? (
              <p className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                {message}
              </p>
            ) : null}
          </section>
        ) : null}

        {tab === "history" ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
                History
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Your latest waste submissions.
              </p>
            </div>

            <button
              type="button"
              onClick={loadHistory}
              className="rounded-md bg-surface-container-low px-3 py-2 text-sm text-on-surface"
            >
              Refresh
            </button>

            <div className="space-y-3">
              {historyLoading ? (
                <p className="text-sm text-on-surface-variant">Loading history...</p>
              ) : historyRows.length ? (
                historyRows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl bg-surface-container-lowest p-4 shadow-ambient"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-headline text-sm font-bold capitalize text-on-surface">
                        {row.waste_type}
                      </p>
                      <span className="rounded-full bg-surface-container-highest px-2.5 py-1 text-xs capitalize text-on-surface-variant">
                        {row.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">{row.zone}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {Number(row.quantity_kg).toFixed(1)}kg •{" "}
                      {new Date(row.submitted_at).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">
                  No entries yet. Submit your first waste entry.
                </p>
              )}
            </div>
          </section>
        ) : null}

        {tab === "profile" ? (
          <section className="space-y-4">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
              Profile
            </h2>
            <div className="rounded-xl bg-surface-container-lowest p-4 shadow-ambient">
              <label className="block text-xs font-medium text-on-surface-variant">
                Display name
                <input
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  type="text"
                  placeholder="Enter display name"
                  className="mt-2 w-full rounded-md border-0 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-ambient ring-1 ring-inset ring-outline-variant/20 focus:outline-none"
                />
              </label>

              <label className="mt-4 block text-xs font-medium text-on-surface-variant">
                Email
                <input
                  value={profileEmail}
                  type="text"
                  readOnly
                  className="mt-2 w-full rounded-md border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant ring-1 ring-inset ring-outline-variant/20"
                />
              </label>

              <label className="mt-4 block text-xs font-medium text-on-surface-variant">
                Phone number
                <input
                  value={profilePhone}
                  type="text"
                  readOnly
                  className="mt-2 w-full rounded-md border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant ring-1 ring-inset ring-outline-variant/20"
                />
              </label>

              <button
                type="button"
                onClick={onSaveProfile}
                disabled={profileSaving}
                className="mt-5 w-full rounded-md bg-gradient-to-r from-primary to-primary-container py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </section>
        ) : null}
      </main>

      <nav className="fixed bottom-0 z-50 w-full rounded-t-2xl border-t border-outline-variant/15 bg-surface-container-lowest">
        <div className="mx-auto flex w-full max-w-md items-center justify-around px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={() => setTab("entry")}
            className={
              tab === "entry"
                ? "flex flex-col items-center justify-center rounded-xl bg-primary-fixed px-5 py-1.5 text-on-primary-fixed"
                : "flex flex-col items-center justify-center px-5 py-1.5 text-on-surface-variant"
            }
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider">
              Log Entry
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className={
              tab === "history"
                ? "flex flex-col items-center justify-center rounded-xl bg-primary-fixed px-5 py-1.5 text-on-primary-fixed"
                : "flex flex-col items-center justify-center px-5 py-1.5 text-on-surface-variant"
            }
          >
            <span className="material-symbols-outlined">history</span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider">
              History
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={
              tab === "profile"
                ? "flex flex-col items-center justify-center rounded-xl bg-primary-fixed px-5 py-1.5 text-on-primary-fixed"
                : "flex flex-col items-center justify-center px-5 py-1.5 text-on-surface-variant"
            }
          >
            <span className="material-symbols-outlined">person</span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider">
              Profile
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

