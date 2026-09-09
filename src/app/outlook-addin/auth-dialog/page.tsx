"use client";

import { FormEvent, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

declare const Office: any;

export default function OutlookAuthDialogPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function officeLoaded() {
    if (typeof Office === "undefined") return;
    Office.onReady(() => setReady(true));
  }

  async function sendSession() {
    const supabase = createClient();
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!data.session) throw new Error("MicroSECONDS could not create a sign-in session.");

    Office.context.ui.messageParent(
      JSON.stringify({
        type: "microseconds-auth-success",
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
      { targetOrigin: window.location.origin }
    );
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      await sendSession();
    } catch (e: any) {
      setError(e?.message || "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <>
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="afterInteractive"
        onLoad={officeLoaded}
      />
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            MicroSECONDS
          </div>
          <h1 className="mt-1 text-2xl font-bold">Sign in to Email Analyzer</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Sign in to your MicroSECONDS account. When sign-in succeeds, this window will close and return you to the email you were analyzing.
          </p>

          {!ready ? (
            <div className="mt-5 text-sm text-slate-400">Preparing secure sign in...</div>
          ) : (
            <form onSubmit={signIn} className="mt-5 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3"
              />
              <button
                disabled={busy}
                className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                {busy ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {error ? (
            <div className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
