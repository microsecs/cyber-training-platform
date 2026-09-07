"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GmailAddonConnectPage() {
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createCode() {
    setBusy(true);
    setError("");
    setCode("");
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        window.location.href = "/login?next=/gmail-addin/connect";
        return;
      }

      const response = await fetch("/api/gmail-addon/connect-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create connection code.");

      setCode(result.code || "");
      setExpiresAt(result.expires_at || "");
    } catch (e: any) {
      setError(e?.message || "Could not create connection code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="text-sm font-semibold text-cyan-300">MicroSECONDS Security Tools</div>
      <h1 className="mt-1 text-4xl font-bold">Connect Gmail</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-400">
        Connect the MicroSECONDS Gmail add-on to your account. The add-on can then send
        the email you currently have open to the Email Risk Analyzer.
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Generate a connection code</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Click below, then enter the 8-character code in the MicroSECONDS Gmail add-on.
          The code expires after 10 minutes and can only be used once.
        </p>

        <button
          type="button"
          onClick={createCode}
          disabled={busy}
          className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
        >
          {busy ? "Generating..." : "Generate Gmail Connection Code"}
        </button>

        {code ? (
          <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Connection code</div>
            <div className="mt-2 font-mono text-4xl font-black tracking-[0.18em] text-cyan-300">
              {code}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Expires {expiresAt ? new Date(expiresAt).toLocaleTimeString() : "in 10 minutes"}
            </div>
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
