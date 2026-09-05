"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Factor = {
  id: string;
  friendly_name?: string;
  status: string;
  factor_type: string;
};

export default function MfaSettings() {
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrollingId, setEnrollingId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [aal, setAal] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const supabase = createClient();

    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const verified =
      factorsData?.totp?.find((item: any) => item.status === "verified") || null;

    setFactor(verified);

    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    setAal(aalData?.currentLevel || "");
  }

  useEffect(() => {
    refresh();
  }, []);

  async function beginEnrollment() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MicroSECONDS Authenticator",
      });

      if (error) throw error;

      setEnrollingId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setMessage(
        "Scan the QR code with your authenticator app, then enter the 6-digit code below."
      );
    } catch (e: any) {
      setError(e?.message || "Could not begin MFA enrollment.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnrollment() {
    if (!enrollingId || code.trim().length !== 6) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enrollingId });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollingId,
        challengeId: challenge.id,
        code: code.trim(),
      });

      if (verifyError) throw verifyError;

      setCode("");
      setQrCode("");
      setSecret("");
      setEnrollingId("");
      setMessage("Multi-factor authentication is now enabled.");
      await refresh();
    } catch (e: any) {
      setError(e?.message || "The verification code could not be confirmed.");
    } finally {
      setBusy(false);
    }
  }

  async function disableMfa() {
    if (!factor) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      if (aal !== "aal2") {
        window.location.href = "/mfa?returnTo=/account#mfa";
        return;
      }

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (error) throw error;

      setFactor(null);
      setMessage("Multi-factor authentication has been disabled.");
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Could not disable MFA.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="mfa"
      className="mt-8 scroll-mt-24 rounded-2xl border border-white/10 bg-slate-900 p-8"
    >
      <div className="text-sm text-cyan-300">Account security</div>
      <h2 className="mt-1 text-2xl font-bold">Multi-Factor Authentication</h2>
      <p className="mt-2 max-w-3xl text-slate-400">
        Protect your account with a time-based 6-digit code from an authenticator
        app such as Microsoft Authenticator, Google Authenticator, 1Password, or
        Apple Passwords.
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-slate-950 p-6">
        <div className="text-sm text-slate-400">Status</div>
        <div
          className={`mt-2 text-xl font-bold ${
            factor ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {factor ? "Enabled" : "Not Enabled"}
        </div>

        {factor ? (
          <>
            <p className="mt-3 text-sm text-slate-400">
              Your authenticator app will be required after your password when
              signing in.
            </p>

            <button
              type="button"
              onClick={disableMfa}
              disabled={busy}
              className="mt-5 rounded-lg border border-red-400/30 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-50"
            >
              {busy ? "Working..." : "Disable MFA"}
            </button>
          </>
        ) : !enrollingId ? (
          <>
            <p className="mt-3 text-sm text-slate-400">
              Platform Admins and company owners/admins are required to use MFA.
              Employees may enable it optionally.
            </p>

            <button
              type="button"
              onClick={beginEnrollment}
              disabled={busy}
              className="mt-5 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {busy ? "Preparing..." : "Enable MFA"}
            </button>
          </>
        ) : (
          <div className="mt-5">
            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
              <div className="rounded-xl bg-white p-3">
                {/* Supabase returns the QR code as a data URL */}
                <img
                  src={qrCode}
                  alt="Authenticator QR code"
                  className="h-auto w-full"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">
                  Scan with your authenticator app
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  After scanning the QR code, enter the current 6-digit code from
                  the authenticator app to finish setup.
                </p>

                {secret ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-cyan-300">
                      Can&apos;t scan the QR code?
                    </summary>
                    <div className="mt-2 break-all rounded-lg border border-white/10 bg-slate-900 p-3 font-mono text-xs text-slate-300">
                      {secret}
                    </div>
                  </details>
                ) : null}

                <div className="mt-5 flex max-w-sm gap-3">
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6-digit code"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 tracking-[0.25em]"
                  />

                  <button
                    type="button"
                    onClick={confirmEnrollment}
                    disabled={busy || code.length !== 6}
                    className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {message ? (
          <div className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
