"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Opening your invitation...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function detectSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setReady(true);
        setMessage("");
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session) {
            setReady(true);
            setMessage("");
          }
        }
      );

      setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (!retry.session) {
          setMessage(
            "No invitation session was detected. Please open this page from the invitation email."
          );
        }
      }, 1800);

      return () => listener.subscription.unsubscribe();
    }

    detectSession();
  }, []);

  async function activate(event: FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("Use a password of at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setBusy(true);
    setMessage("");

    const supabase = createClient();

    const { error: passwordError } =
      await supabase.auth.updateUser({ password });

    if (passwordError) {
      setMessage(passwordError.message);
      setBusy(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setMessage("Your invitation session expired. Please reopen the invite link.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/accept-invite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Could not finish company enrollment.");
      setBusy(false);
      return;
    }

    setMessage("Account activated. Opening your training dashboard...");
    setTimeout(() => {
      window.location.href = "/employee";
    }, 700);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
        <div className="text-sm text-cyan-300">Employee Invitation</div>
        <h1 className="mt-2 text-3xl font-bold">Activate your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Choose a password to join your employer&apos;s CyberAware account.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
            {message}
          </div>
        ) : (
          <form onSubmit={activate} className="mt-7 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400/50"
              />
            </div>

            <button
              disabled={busy}
              className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? "Activating..." : "Activate Account"}
            </button>

            {message && (
              <div className="rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-300">
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
