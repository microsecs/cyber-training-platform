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

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setReady(true);
        setMessage("");
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setReady(true);
          setMessage("");
        }
      });

      window.setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (!retry.session) {
          setMessage(
            "The invitation session was not detected. Open this page using the link in the invitation email."
          );
        }
      }, 1500);

      return () => listener.subscription.unsubscribe();
    }

    checkSession();
  }, []);

  async function setNewPassword(event: FormEvent) {
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
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    setMessage("Account activated. Taking you to your training...");
    window.setTimeout(() => {
      window.location.href = "/employee";
    }, 700);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
        <div className="text-sm text-cyan-300">Employee Invitation</div>
        <h1 className="mt-2 text-3xl font-bold">Activate your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Choose a password for your employee training account.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
            {message}
          </div>
        ) : (
          <form onSubmit={setNewPassword} className="mt-7 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">New password</label>
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
              <label className="mb-2 block text-sm text-slate-300">Confirm password</label>
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
