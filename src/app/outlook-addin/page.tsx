"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

declare const Office: any;

type Analysis = {
  score: number;
  level: string;
  summary: string;
  findings: string[];
  recommendations: string[];
  technical_note?: string;
};

function addressText(value: any): string {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map(addressText).filter(Boolean).join(", ");
  }
  if (typeof value === "string") return value;
  const name = value.displayName || value.name || "";
  const email = value.emailAddress || value.address || "";
  if (name && email) return `${name} <${email}>`;
  return email || name || "";
}

function officeAsync<T>(fn: (callback: (result: any) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((result: any) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value as T);
      } else {
        reject(new Error(result.error?.message || "Outlook could not read this message."));
      }
    });
  });
}

export default function OutlookAddinPage() {
  const [officeReady, setOfficeReady] = useState(false);
  const [officeError, setOfficeError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [reading, setReading] = useState(false);

  const [signedIn, setSignedIn] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const scoreTone = useMemo(() => {
    if (!analysis) return "";
    if (analysis.score >= 75) return "text-red-300";
    if (analysis.score >= 50) return "text-orange-300";
    if (analysis.score >= 25) return "text-amber-300";
    return "text-emerald-300";
  }, [analysis]);

  async function refreshAuthState() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setSignedIn(false);
      setNeedsMfa(false);
      return;
    }

    setSignedIn(true);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((item: any) => item.status === "verified");

    if (verified) {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aal?.currentLevel !== "aal2") {
        setFactorId(verified.id);
        setNeedsMfa(true);
        return;
      }
    }

    setNeedsMfa(false);
  }

  async function loadCurrentMessage() {
    if (typeof Office === "undefined" || !Office.context?.mailbox?.item) return;

    setReading(true);
    setError("");
    setAnalysis(null);

    try {
      const item = Office.context.mailbox.item;

      const subject = item.subject || "";
      const from = addressText(item.from || item.sender);
      const to = addressText(item.to);
      const cc = addressText(item.cc);

      let body = "";
      if (item.body?.getAsync) {
        body = await officeAsync<string>((callback) =>
          item.body.getAsync(Office.CoercionType.Text, callback)
        );
      }

      let headers = "";
      if (typeof item.getAllInternetHeadersAsync === "function") {
        try {
          headers = await officeAsync<string>((callback) =>
            item.getAllInternetHeadersAsync(callback)
          );
        } catch {
          // Header API isn't available in every Outlook client/mailbox.
        }
      }

      const attachmentNames = Array.isArray(item.attachments)
        ? item.attachments
            .map((attachment: any) => attachment?.name)
            .filter(Boolean)
            .join(", ")
        : "";

      const combined = [
        subject ? `Subject: ${subject}` : "",
        from ? `From: ${from}` : "",
        to ? `To: ${to}` : "",
        cc ? `CC: ${cc}` : "",
        attachmentNames ? `Attachments: ${attachmentNames}` : "",
        headers ? `\n--- MESSAGE HEADERS ---\n${headers}` : "",
        body ? `\n--- MESSAGE BODY ---\n${body}` : "",
      ]
        .filter(Boolean)
        .join("\n")
        .trim();

      setMessageSubject(subject);
      setMessageText(combined);
    } catch (e: any) {
      setError(e?.message || "Could not read the selected Outlook message.");
    } finally {
      setReading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!officeReady) {
        setOfficeError(
          "Outlook did not finish initializing the MicroSECONDS add-in. Close the task pane, reopen the email, and try the add-in again."
        );
      }
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [officeReady]);

  function initializeOffice() {
    try {
      if (typeof Office === "undefined") {
        setOfficeError("Microsoft Office.js did not load.");
        return;
      }

      let completed = false;

      const ready = () => {
        if (completed) return;
        completed = true;
        setOfficeError("");
        setOfficeReady(true);
        refreshAuthState();
        loadCurrentMessage();
      };

      // Current Office.js initialization path.
      if (typeof Office.onReady === "function") {
        Office.onReady(() => ready());
      }

      // Compatibility fallback for older/classic Outlook webviews.
      Office.initialize = () => ready();

      // Some clients already have a mailbox context by the time the script loads.
      if (Office.context?.mailbox) {
        window.setTimeout(ready, 0);
      }
    } catch (e: any) {
      setOfficeError(e?.message || "Outlook could not initialize the MicroSECONDS add-in.");
    }
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
      setPassword("");
      await refreshAuthState();
    } catch (e: any) {
      setError(e?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setSignedIn(false);
      setNeedsMfa(false);
      setFactorId("");
      setMfaCode("");
      setAnalysis(null);
    } catch (e: any) {
      setError(e?.message || "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyMfa(event: FormEvent) {
    event.preventDefault();
    if (!factorId || mfaCode.length !== 6) return;

    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: mfaCode,
      });

      if (verifyError) throw verifyError;

      setMfaCode("");
      await refreshAuthState();
    } catch (e: any) {
      setError(e?.message || "The authenticator code could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  async function analyze() {
    setBusy(true);
    setError("");
    setAnalysis(null);

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setSignedIn(false);
        throw new Error("Sign in to MicroSECONDS before analyzing this message.");
      }

      const response = await fetch("/api/phishing-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emailText: messageText }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not analyze this message.");
      }

      setAnalysis(result.analysis);
    } catch (e: any) {
      setError(e?.message || "Could not analyze this message.");
    } finally {
      setBusy(false);
    }
  }

  if (!officeReady) {
    return (
      <>
        <Script
          src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
          strategy="afterInteractive"
          onLoad={initializeOffice}
          onError={() =>
            setOfficeError(
              "Microsoft Office.js could not be loaded. Check that Outlook can reach appsforoffice.microsoft.com."
            )
          }
        />

        <main className="min-h-screen bg-slate-950 p-5 text-slate-300">
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="text-sm font-semibold text-cyan-300">MicroSECONDS</div>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Email Risk Analyzer
            </h1>

            {officeError ? (
              <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm leading-6 text-red-200">
                {officeError}
              </div>
            ) : (
              <div className="mt-5 text-sm text-slate-400">
                Connecting to Outlook...
              </div>
            )}

            {officeError ? (
              <button
                type="button"
                onClick={initializeOffice}
                className="mt-5 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Try Again
              </button>
            ) : null}
          </div>

          <footer className="mx-auto mt-6 max-w-md border-t border-white/10 py-4 text-center text-xs text-slate-600">
            © 2026 MicroSECONDS Computer Consulting. All rights reserved.
          </footer>
        </main>
      </>
    );
  }

  return (
    <>
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="afterInteractive"
        onLoad={initializeOffice}
      />

      <main className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                MicroSECONDS
              </div>
              <h1 className="mt-1 text-2xl font-bold">Email Risk Analyzer</h1>
            </div>

            {signedIn ? (
              <button
                type="button"
                onClick={signOut}
                disabled={busy}
                className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
              >
                Sign Out
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Analyze the Outlook message you currently have open.
          </p>

          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-4">
            <div className="text-xs text-slate-500">Selected message</div>
            <div className="mt-1 truncate font-semibold text-slate-100">
              {messageSubject || "No subject"}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {messageText
                ? `${messageText.length.toLocaleString()} characters loaded`
                : "No message content loaded"}
            </div>

            <button
              type="button"
              onClick={loadCurrentMessage}
              disabled={reading}
              className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-sm hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
            >
              {reading ? "Reading..." : "Refresh Message"}
            </button>
          </div>

          {!signedIn ? (
            <form onSubmit={signIn} className="mt-5 space-y-3">
              <div className="text-sm font-semibold">Sign in to MicroSECONDS</div>
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
                className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
              >
                {busy ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : needsMfa ? (
            <form onSubmit={verifyMfa} className="mt-5 space-y-3">
              <div className="text-sm font-semibold">Authenticator verification</div>
              <p className="text-xs leading-5 text-slate-400">
                Enter the current 6-digit code from your authenticator app.
              </p>
              <input
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) =>
                  setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-center tracking-[0.3em]"
              />
              <button
                disabled={busy || mfaCode.length !== 6}
                className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                Verify
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={analyze}
              disabled={busy || messageText.length < 20}
              className="mt-5 w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {busy ? "Analyzing..." : "Analyze with MicroSECONDS"}
            </button>
          )}

          {error ? (
            <div className="mt-4 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        {analysis ? (
          <section className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Risk assessment
            </div>
            <div className={`mt-2 text-4xl font-bold ${scoreTone}`}>
              {analysis.score}
              <span className="text-xl">/100</span>
            </div>
            <div className={`mt-1 text-lg font-bold ${scoreTone}`}>
              {analysis.level}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {analysis.summary}
            </p>

            <div className="mt-5">
              <div className="text-sm font-semibold">Key findings</div>
              <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-400">
                {analysis.findings.map((finding, index) => (
                  <li key={index}>• {finding}</li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold">Recommended action</div>
              <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-400">
                {analysis.recommendations.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>

      <footer className="mx-auto mt-6 max-w-xl border-t border-white/10 py-4 text-center text-xs text-slate-600">
        © 2026 MicroSECONDS Computer Consulting. All rights reserved.
      </footer>
    </main>
    </>
  );
}
