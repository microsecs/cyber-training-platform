"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Analysis = {
  score: number;
  level: "LOW RISK" | "CAUTION" | "SUSPICIOUS" | "HIGH RISK";
  summary: string;
  findings: string[];
  recommendations: string[];
  technical_note?: string;
  technical_checks?: Array<{
    label: string;
    status: "pass" | "warning" | "danger" | "info";
    detail: string;
  }>;
};

export default function PhishingCheckPage() {
  const [emailText, setEmailText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileBusy, setFileBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysisStage, setAnalysisStage] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const analysisSteps = [
    "Reading email content",
    "Checking email headers",
    "Verifying sender information",
    "Checking DNS records",
    "Analyzing links and domains",
    "Checking attachments",
    "Running AI analysis",
    "Calculating risk score",
    "Generating recommendations",
  ];

  useEffect(() => {
    if (!busy) return;
    setAnalysisStage(0);
    const timer = window.setInterval(() => {
      setAnalysisStage((current) => Math.min(current + 1, analysisSteps.length - 1));
    }, 850);
    return () => window.clearInterval(timer);
  }, [busy]);

  async function getToken() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function importEmailFile(file: File) {
    setError("");
    setAnalysis(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".msg") && !lower.endsWith(".eml")) {
      setError("Choose an Outlook .msg file or an .eml email file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Email files are limited to 15 MB.");
      return;
    }
    setFileBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in to use Email Risk Analyzer.");
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/phishing-check/import-email", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not read the email file.");
      setEmailText(result.emailText || "");
      setFileName(file.name);
    } catch (e: any) {
      setError(e?.message || "Could not read the email file.");
    } finally {
      setFileBusy(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await importEmailFile(file);
  }

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
        body: JSON.stringify({ emailText, source: "web" }),
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

      <section className="mt-7 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragging ? "border-cyan-300 bg-cyan-400/10" : "border-white/15 bg-slate-950"
          }`}
        >
          <div className="text-xl font-semibold text-white">Drag an Outlook email here</div>
          <p className="mt-2 text-sm text-slate-400">Or choose an email file from your computer.</p>
          <p className="mt-1 text-xs text-slate-500">Supported: .msg and .eml • Maximum 15 MB</p>
          <input
            ref={fileInput}
            type="file"
            accept=".msg,.eml,message/rfc822,application/vnd.ms-outlook"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) await importEmailFile(file);
              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            disabled={fileBusy}
            onClick={() => fileInput.current?.click()}
            className="mt-5 rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
          >
            {fileBusy ? "Reading Email..." : "Choose Email File"}
          </button>
          {fileName ? <div className="mt-4 text-sm text-emerald-300">Loaded: {fileName}</div> : null}
        </div>

        <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-slate-600">
          <div className="h-px flex-1 bg-white/10" />Or paste the email<div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={analyze}>
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
      </section>


      {busy ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900">
          <div className="border-b border-white/10 bg-cyan-400/[0.06] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-white">Analyzing your email...</div>
                <div className="mt-1 text-xs text-slate-400">
                  Running security checks and AI analysis.
                </div>
              </div>
              <div className="text-sm font-semibold text-cyan-300">
                {Math.min(95, Math.round(((analysisStage + 1) / analysisSteps.length) * 100))}%
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                style={{ width: `${Math.min(95, ((analysisStage + 1) / analysisSteps.length) * 100)}%` }}
              />
            </div>
          </div>

          <div className="grid gap-1 p-4 md:grid-cols-2">
            {analysisSteps.map((step, index) => {
              const complete = index < analysisStage;
              const active = index === analysisStage;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    active ? "bg-cyan-400/10 text-cyan-100" : "text-slate-400"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      complete
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                        : active
                        ? "border-cyan-400/40 text-cyan-300"
                        : "border-white/10 text-slate-600"
                    }`}
                  >
                    {complete ? (
                      <span className="text-xs font-bold">✓</span>
                    ) : active ? (
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <span>{step}</span>
                  {complete ? <span className="ml-auto text-xs text-emerald-400">Complete</span> : null}
                  {active ? <span className="ml-auto text-xs text-cyan-300">Checking...</span> : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

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


          {analysis.technical_checks?.length ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Technical checks</h2>
              <p className="mt-1 text-xs text-slate-500">
                Header authentication, domain age, DNS policy, URL structure, attachment type, and optional reputation checks.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {analysis.technical_checks.map((check, i) => (
                  <div
                    key={`${check.label}-${i}`}
                    className={`rounded-xl border p-4 text-sm ${
                      check.status === "danger"
                        ? "border-red-400/25 bg-red-400/10"
                        : check.status === "warning"
                        ? "border-amber-400/25 bg-amber-400/10"
                        : check.status === "pass"
                        ? "border-emerald-400/25 bg-emerald-400/10"
                        : "border-white/10 bg-slate-950"
                    }`}
                  >
                    <div className="font-semibold text-slate-100">{check.label}</div>
                    <div className="mt-1 leading-5 text-slate-400">{check.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
