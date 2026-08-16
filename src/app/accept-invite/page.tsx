"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

export default function AcceptInvitePage() {
  const search = useSearchParams();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Opening your invitation...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const error = search.get("error");
    if (error) {
      setMessage(decodeURIComponent(error));
      return;
    }

    const supabase = createClient();

    async function init() {
      const hash = window.location.hash;

      // Support Supabase's implicit invite flow if tokens are delivered in the URL fragment.
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

      setMessage(
        "No invitation session was detected. Please use a fresh invitation email. Also verify the Supabase redirect URL settings."
      );
    }

    init();
  }, [search]);

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
      setMessage("Your invitation session expired. Please use a fresh invite.");
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

    window.location.href = "/employee";
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
        <div className="text-sm text-cyan-300">Employee Invitation</div>
        <h1 className="mt-2 text-3xl font-bold">Activate your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Choose a password to join your employer&apos;s training account.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
            {message}
          </div>
        ) : (
          <form onSubmit={activate} className="mt-7 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="New password"
              minLength={8}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              minLength={8}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
            />
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
