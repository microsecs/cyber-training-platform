"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultPathForRole, resolveUserAccess } from "@/lib/supabase/access";

export default function MfaChallengePage() {
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find(
        (item: any) => item.status === "verified"
      );

      if (!verified) {
        window.location.href = "/mfa/setup";
        return;
      }

      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aal?.currentLevel === "aal2") {
        const access = await resolveUserAccess();
        window.location.href = defaultPathForRole(access.role);
        return;
      }

      setFactorId(verified.id);
      setReady(true);
    }

    prepare();
  }, []);

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!factorId || code.length !== 6) return;

    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) throw verifyError;

      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");

      if (returnTo && returnTo.startsWith("/")) {
        window.location.href = returnTo;
        return;
      }

      const access = await resolveUserAccess();
      window.location.href = defaultPathForRole(access.role);
    } catch (e: any) {
      setMessage(e?.message || "The authentication code is incorrect.");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-md px-6 py-12 text-slate-400">
        Preparing multi-factor authentication...
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
        <div className="text-sm text-cyan-300">Security verification</div>
        <h1 className="mt-2 text-3xl font-bold">Enter your 6-digit code</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Open your authenticator app and enter the current code for
          MicroSECONDS.
        </p>

        <form onSubmit={verify} className="mt-6 space-y-4">
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-4 text-center text-2xl tracking-[0.4em]"
          />

          <button
            disabled={busy || code.length !== 6}
            className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {busy ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="mt-5 text-sm text-slate-400 hover:text-white"
        >
          Sign in with a different account
        </button>
      </div>
    </main>
  );
}
