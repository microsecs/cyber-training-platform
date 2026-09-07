"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GmailAddonConnectPage() {
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const generatedForSession = useRef(false);

  async function generateCode(accessToken?: string) {
    setBusy(true);
    setError("");
    setCode("");

    try {
      let token = accessToken || "";

      if (!token) {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token || "";
      }

      if (!token) {
        setSignedIn(false);
        setBusy(false);
        return;
      }

      setSignedIn(true);

      const response = await fetch("/api/gmail-addon/connect-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        setSignedIn(false);
        throw new Error(
          result.error || "Your MicroSECONDS session could not be verified. Please sign in again."
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Could not create connection code.");
      }

      setCode(result.code || "");
      setExpiresAt(result.expires_at || "");
    } catch (e: any) {
      setError(e?.message || "Could not create connection code.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function initializePairing() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      const session = data.session;

      if (!session?.access_token) {
        setSignedIn(false);
        setBusy(false);
        return;
      }

      setSignedIn(true);

      if (!generatedForSession.current) {
        generatedForSession.current = true;
        await generateCode(session.access_token);
      }
    }

    initializePairing();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;

      if (!session?.access_token) {
        generatedForSession.current = false;
        setSignedIn(false);
        setCode("");
        setBusy(false);
        return;
      }

      setSignedIn(true);

      if (!generatedForSession.current) {
        generatedForSession.current = true;
        generateCode(session.access_token);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="text-sm font-semibold text-cyan-300">MicroSECONDS Security Tools</div>
      <h1 className="mt-1 text-4xl font-bold">Connect Gmail</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-400">
        Connect the MicroSECONDS Gmail add-on to your account. The add-on can then send
        the email you currently have open to the Email Risk Analyzer.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Gmail pairing does not require MFA setup. If your account uses MFA elsewhere,
        those requirements remain unchanged outside this connection page.
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Generate a connection code</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Once you are signed in, MicroSECONDS automatically generates an 8-character code.
          Enter that code in the Gmail add-on. The code expires after 10 minutes and can only be used once.
        </p>

        {signedIn === false ? (
          <div className="mt-5">
            <a
              href="/login?next=/gmail-addin/connect"
              className="inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Sign In to Get Connection Code
            </a>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              After signing in, MicroSECONDS will return here and generate the code automatically.
            </p>
          </div>
        ) : busy ? (
          <div className="mt-5 flex items-center gap-3 text-sm text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300" />
            Generating Gmail connection code...
          </div>
        ) : code ? null : (
          <button
            type="button"
            onClick={() => generateCode()}
            className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Generate New Connection Code
          </button>
        )}

        {code ? (
          <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Connection code</div>
            <div className="mt-2 font-mono text-4xl font-black tracking-[0.18em] text-cyan-300">
              {code}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Expires {expiresAt ? new Date(expiresAt).toLocaleTimeString() : "in 10 minutes"}
            </div>
            <button
              type="button"
              onClick={() => generateCode()}
              disabled={busy}
              className="mt-4 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
            >
              Generate New Code
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
            {error}
          </div>
        ) : null}
      </section>

      <div className="mt-6 rounded-xl border border-white/10 bg-slate-950 p-5 text-sm leading-6 text-slate-400">
        MicroSECONDS only analyzes a Gmail message when you explicitly click
        <span className="font-semibold text-slate-200"> Analyze with MicroSECONDS</span>.
      </div>
    </main>
  );
}
