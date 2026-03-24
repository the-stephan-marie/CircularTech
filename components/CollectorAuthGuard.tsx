"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function CollectorAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getSupabaseClient()
      .auth.getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.session?.user) {
          router.replace("/login");
          return;
        }
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
