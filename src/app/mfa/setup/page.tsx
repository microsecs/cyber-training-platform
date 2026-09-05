"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultPathForRole, resolveUserAccess } from "@/lib/supabase/access";

export default function MfaSetupPage() {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [optional, setOptional] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOptional(params.get("optional") === "1");

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

      if (verified) {
        window.location.href = "/mfa";
        return;
      }

      const unverified = factors?.totp?.find(
        (item: any) => item.status === "unverified"
      );

      if (unverified) {
        await supabase.auth.mfa.unenroll({ factorId: unverified.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MicroSECONDS Authenticator",
      });

      if (error) {
        setMessage(error.message);
        setReady(true);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
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

      const access = await resolveUserAccess();
      window.location.href = defaultPathForRole(access.role);
    } catch (e: any) {
      setMessage(e?.message || "The verification code could not be confirmed.");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12 text-slate-400">
        Preparing multi-factor authentication...
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
        <div className="text-sm text-cyan-300">
          {optional ? "Recommended account security" : "Required account security"}
        </div>
        <h1 className="mt-2 text-3xl font-bold">
          Set up multi-factor authentication
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-400">
          {optional
            ? "Your account has company administrative access. We strongly recommend protecting it with an authenticator app in addition to your password."
            : "Your account has platform administration access, so MicroSECONDS requires an authenticator app in addition to your password."}
        </p>

        {qrCode ? (
          <div className="mt-7 grid gap-7 md:grid-cols-[240px_1fr] md:items-start">
            <div className="rounded-xl bg-white p-3">
              <img
                src={qrCode}
                alt="Authenticator QR code"
                className="h-auto w-full"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white">
                1. Scan the QR code
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use Microsoft Authenticator, Google Authenticator, 1Password,
                Apple Passwords, or another TOTP-compatible app.
              </p>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-cyan-300">
                  Can&apos;t scan the QR code?
                </summary>
                <div className="mt-2 break-all rounded-lg border border-white/10 bg-slate-950 p-3 font-mono text-xs text-slate-300">
                  {secret}
                </div>
              </details>

              <h2 className="mt-7 text-xl font-semibold text-white">
                2. Verify the 6-digit code
              </h2>

              <form onSubmit={verify} className="mt-3 flex max-w-sm gap-3">
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
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-center tracking-[0.3em]"
                />

                <button
                  disabled={busy || code.length !== 6}
                  className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                >
                  {busy ? "Verifying..." : "Enable MFA"}
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        {optional ? (
          <button
            type="button"
            onClick={async () => {
              const access = await resolveUserAccess();
              window.location.href = defaultPathForRole(access.role);
            }}
            className="mt-6 text-sm font-medium text-slate-400 hover:text-white"
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </main>
  );
}
