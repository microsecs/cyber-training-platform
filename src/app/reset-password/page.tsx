"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Opening password recovery link...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function initRecovery() {
      // Handle implicit-flow recovery tokens if Supabase returns them in the hash.
      const hash = window.location.hash;

      if (hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            setMessage(error.message);
            return;
          }

          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setReady(true);
        setMessage("");
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setReady(true);
          setMessage("");
        }
      });

      setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (!retry.session) {
          setMessage(
            "No password recovery session was detected. Please use a fresh password reset email."
          );
        }
      }, 1500);

      return () => listener.subscription.unsubscribe();
    }

    initRecovery();
  }, []);

  async function updatePassword(event: FormEvent) {
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

    setMessage("Password updated. Redirecting to sign in...");
    await supabase.auth.signOut();

    setTimeout(() => {
      window.location.href = "/login";
    }, 700);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
        <div className="text-sm text-cyan-300">Password Recovery</div>
        <h1 className="mt-2 text-3xl font-bold">Choose a new password</h1>

        {!ready ? (
          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
            {message}
          </div>
        ) : (
          <form onSubmit={updatePassword} className="mt-7 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              minLength={8}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
            />

            <button
              disabled={busy}
              className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? "Updating..." : "Update Password"}
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
