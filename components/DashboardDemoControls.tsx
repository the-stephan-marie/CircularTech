"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function DashboardDemoControls() {
  const [demoActive, setDemoActive] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [clearingDemo, setClearingDemo] = useState(false);
  const demoTickRef = useRef(0);

  useEffect(() => {
    if (!demoActive) return;

    let cancelled = false;

    async function insertOne() {
      const tick = demoTickRef.current;
      try {
        const res = await fetch("/api/demo-feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tick }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error ?? "Demo feed failed.");
        }
        demoTickRef.current = tick + 1;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        if (!cancelled) {
          setDemoMessage(`Demo feed error: ${reason}`);
          setDemoActive(false);
        }
      }
    }

    void insertOne();
    const id = window.setInterval(() => {
      void insertOne();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [demoActive]);

  async function clearDemoData() {
    if (
      !window.confirm(
        "Remove all waste submissions? This resets the dashboard and cannot be undone."
      )
    ) {
      return;
    }

    setClearingDemo(true);
    setDemoMessage(null);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("You must be signed in.");
      }

      const res = await fetch("/api/clear-waste-entries", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to clear data.");
      }

      setDemoActive(false);
      demoTickRef.current = 0;
      setDemoMessage("All waste entries removed.");
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setDemoMessage(`Clear failed: ${reason}`);
    } finally {
      setClearingDemo(false);
    }
  }

  return (
    <div className="flex max-w-full flex-col items-end gap-2 sm:max-w-[min(100%,28rem)]">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => {
            setDemoActive((active) => {
              if (active) {
                setDemoMessage(null);
                return false;
              }
              demoTickRef.current = 0;
              setDemoMessage("Running...");
              return true;
            });
          }}
          aria-pressed={demoActive}
          aria-label={demoActive ? "Stop demo feed" : "Start demo feed"}
          title={demoActive ? "Stop demo feed" : "Start demo feed"}
          className={
            demoActive
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-headline text-sm font-bold text-on-primary-fixed shadow-ambient transition-opacity hover:opacity-90 sm:h-11 sm:w-11 sm:text-base"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container font-headline text-sm font-bold text-white shadow-ambient transition-opacity hover:opacity-90 sm:h-11 sm:w-11 sm:text-base"
          }
        >
          D
        </button>
        <button
          type="button"
          onClick={clearDemoData}
          disabled={clearingDemo}
          aria-label="Clear demo data"
          aria-busy={clearingDemo}
          title="Clear demo data"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-low font-headline text-sm font-bold text-on-surface shadow-ambient transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11 sm:text-base"
        >
          C
        </button>
      </div>
      {demoMessage ? (
        <p className="text-right text-[11px] leading-snug text-on-surface-variant sm:text-xs">
          {demoMessage}
        </p>
      ) : null}
    </div>
  );
}
