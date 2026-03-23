"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If the user is already authenticated, send them straight to the collector flow.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) router.replace("/collector");
    });
  }, [router, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;

      router.replace("/collector");
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setError(reason);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-on-background">
      <main className="mx-auto flex w-full max-w-md flex-col px-6 pb-12 pt-20">
        <div className="mb-8">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
            Collector Login
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Admins create accounts and you can sign in using your email and password.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xl bg-surface-container-lowest p-6 shadow-ambient"
        >
          <label className="block text-xs font-medium text-on-surface-variant">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-md border-0 bg-surface-container-lowest px-3 py-2 text-sm shadow-ambient ring-1 ring-inset ring-outline-variant/20 focus:outline-none"
            />
          </label>

          <label className="block mt-4 text-xs font-medium text-on-surface-variant">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border-0 bg-surface-container-lowest px-3 py-2 text-sm shadow-ambient ring-1 ring-inset ring-outline-variant/20 focus:outline-none"
            />
          </label>

          {error ? (
            <div className="mt-4 rounded-lg bg-error-container px-3 py-2 text-sm text-on-error">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-4 font-headline text-lg font-bold text-white shadow-ambient transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-on-surface-variant">
          No sign-up available in this demo.
        </p>
      </main>
    </div>
  );
}

