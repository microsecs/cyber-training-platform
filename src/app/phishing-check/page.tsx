"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Analysis = {
  score: number;
  level: "LOW RISK" | "CAUTION" | "SUSPICIOUS" | "HIGH RISK";
  summary: string;
  findings: string[];
  recommendations: string[];
  technical_note?: string;
};

export default function PhishingCheckPage() {
  const [emailText, setEmailText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function analyze(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setAnalysis(null);

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Please sign in to use Email Risk Analyzer.");

      const response = await fetch("/api/phishing-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emailText }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not analyze this email.");
      setAnalysis(result.analysis);
    } catch (e: any) {
      setError(e?.message || "Could not analyze this email.");
    } finally {
      setBusy(false);
    }
  }

  const tone =
    analysis?.level === "HIGH RISK"
      ? "border-red-400/30 bg-red-400/10 text-red-200"
      : analysis?.level === "SUSPICIOUS"
      ? "border-orange-400/30 bg-orange-400/10 text-orange-200"
      : analysis?.level === "CAUTION"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="text-sm font-medium text-cyan-300">MicroSECONDS Security Tools</div>
      <h1 className="mt-1 text-4xl font-bold">Email Risk Analyzer</h1>
      <p className="mt-3 max-w-3xl text-slate-400">
        Paste a suspicious email below. MicroSECONDS will examine common phishing indicators and use AI to evaluate the message&apos;s context, requests, links, impersonation attempts, and social-engineering language.
      </p>

      <form onSubmit={analyze} className="mt-7 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <label className="block text-sm font-semibold text-slate-200">
          Paste the email
        </label>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          For a stronger analysis, paste the complete raw email including headers when available. Do not paste passwords or other secrets.
        </p>
        <textarea
          required
          maxLength={50000}
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder={"Paste the sender, subject, message, links, and headers here..."}
          className="mt-4 min-h-[330px] w-full rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-cyan-400/50"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{emailText.length.toLocaleString()} / 50,000 characters</span>
          <button
            disabled={busy || emailText.trim().length < 20}
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Analyzing..." : "Analyze Email"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div>
      ) : null}

      {analysis ? (
        <section className="mt-7 space-y-5">
          <div className={`rounded-2xl border p-6 ${tone}`}>
            <div className="text-sm font-semibold uppercase tracking-[0.18em]">Risk assessment</div>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <div className="text-5xl font-bold">{analysis.score}<span className="text-2xl">/100</span></div>
              <div className="pb-1 text-2xl font-bold">{analysis.level}</div>
            </div>
            <p className="mt-4 max-w-3xl leading-7">{analysis.summary}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Why it received this score</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                {analysis.findings.map((item, i) => <li key={i}>• {item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">What to do next</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                {analysis.recommendations.map((item, i) => <li key={i}>• {item}</li>)}
              </ul>
            </div>
          </div>

          {analysis.technical_note ? (
            <div className="rounded-xl border border-white/10 bg-slate-900 p-5 text-sm text-slate-400">
              <span className="font-semibold text-slate-200">Technical note: </span>
              {analysis.technical_note}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-7 rounded-xl border border-white/10 bg-slate-900/60 p-5 text-xs leading-6 text-slate-500">
        Email Risk Analyzer is an aid, not a guarantee that an email is safe or malicious. When in doubt, do not use links, attachments, phone numbers, or reply addresses in the suspicious message. Verify the request through a known contact method or contact your IT department. Submitted email text is analyzed for this request and is not intentionally saved by MicroSECONDS.
      </div>
    </main>
  );
}
