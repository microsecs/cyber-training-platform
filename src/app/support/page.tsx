"use client";

import { useEffect, useState } from "react";

type SupportSettings = {
  support_email: string;
  remote_pc_support_url: string | null;
  remote_mac_support_url: string | null;
};

const DEFAULTS: SupportSettings = {
  support_email: "support@microseconds.com",
  remote_pc_support_url: null,
  remote_mac_support_url: null,
};

export default function SupportPage() {
  const [settings, setSettings] = useState<SupportSettings>(DEFAULTS);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);

  async function submitSupport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setFeedback("");
    setFailed(false);
    try {
      const response = await fetch("/api/support-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send your request.");
      setFeedback("Your support request has been sent. We'll get back to you by email.");
      setSubject("");
      setMessage("");
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "Unable to send your request.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    fetch("/api/support-settings")
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result?.settings) setSettings({ ...DEFAULTS, ...result.settings });
      })
      .catch(() => {});
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 md:p-10">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Support</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">MicroSECONDS Support</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          Need help with your computer or your MicroSECONDS account? Contact us or, when directed by a MicroSECONDS technician, start a remote-support session below.
        </p>

        <section className="mt-8 rounded-xl border border-white/10 bg-slate-950 p-6">
          <h2 className="text-2xl font-semibold text-white">Contact Support</h2>
          <p className="mt-3 text-slate-300">
            Tell us what you need help with and include any error messages or relevant details.
          </p>
          <form onSubmit={submitSupport} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-slate-300">
                <span className="mb-2 block">Name</span>
                <input required maxLength={120} autoComplete="name" value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </label>
              <label className="block text-slate-300">
                <span className="mb-2 block">Email</span>
                <input required type="email" maxLength={254} autoComplete="email" value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </label>
            </div>
            <label className="block text-slate-300">
              <span className="mb-2 block">Subject</span>
              <input required maxLength={180} value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </label>
            <label className="block text-slate-300">
              <span className="mb-2 block">How can we help?</span>
              <textarea required rows={6} maxLength={5000} value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </label>
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="support-website">Leave this field empty</label>
              <input id="support-website" tabIndex={-1} autoComplete="off" value={website}
                onChange={(event) => setWebsite(event.target.value)} />
            </div>
            {feedback && <p role="status" className={failed ? "text-red-300" : "text-emerald-300"}>{feedback}</p>}
            <button type="submit" disabled={sending}
              className="rounded-lg bg-sky-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60">
              {sending ? "Sending..." : "Submit Support Request"}
            </button>
          </form>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold text-white">Remote Support</h2>
          <p className="mt-2 text-slate-400">
            Only start a remote-support session when instructed by a MicroSECONDS technician.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {settings.remote_pc_support_url ? (
              <a
                href={settings.remote_pc_support_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-4 text-center font-semibold text-slate-950 hover:bg-cyan-300"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M3 4.7 10.7 3.6v7.5H3V4.7Zm8.7-1.2L21 2.2v8.9h-9.3V3.5ZM3 12.1h7.7v7.5L3 18.5v-6.4Zm8.7 0H21V21l-9.3-1.3v-7.6Z" />
                </svg>
                <span>Remote PC</span>
              </a>
            ) : null}

            {settings.remote_mac_support_url ? (
              <a
                href={settings.remote_mac_support_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-4 text-center font-semibold text-slate-950 hover:bg-cyan-300"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                  <path d="M16.7 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.9-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3.1-.7s1.9.7 3.1.7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-3.7ZM14.4 6c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.3-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.2Z" />
                </svg>
                <span>Remote MAC</span>
              </a>
            ) : null}
          </div>

          {!settings.remote_pc_support_url && !settings.remote_mac_support_url ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5 text-sm text-slate-400">
              Remote-support links are currently unavailable. Please use the support request form above for assistance.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
