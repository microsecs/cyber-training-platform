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
          <div className="text-sm text-slate-400">Support Email</div>
          <a
            href={`mailto:${settings.support_email}`}
            className="mt-2 inline-block text-xl font-semibold text-cyan-300 hover:text-cyan-200"
          >
            {settings.support_email}
          </a>
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
                className="rounded-xl bg-cyan-400 px-5 py-4 text-center font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Remote Support – Windows PC
              </a>
            ) : null}

            {settings.remote_mac_support_url ? (
              <a
                href={settings.remote_mac_support_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-slate-800 px-5 py-4 text-center font-semibold text-white hover:bg-slate-700"
              >
                Remote Support – Mac
              </a>
            ) : null}
          </div>

          {!settings.remote_pc_support_url && !settings.remote_mac_support_url ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5 text-sm text-slate-400">
              Remote-support links are currently unavailable. Please email {settings.support_email} for assistance.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
