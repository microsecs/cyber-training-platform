"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UsageRow = {
  company_id: string;
  company_name: string;
  count: number;
};

export default function AnalyzerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limitsEnabled, setLimitsEnabled] = useState(true);
  const [companyDailyLimit, setCompanyDailyLimit] = useState(100);
  const [userHourlyLimit, setUserHourlyLimit] = useState(20);
  const [today, setToday] = useState(0);
  const [month, setMonth] = useState(0);
  const [byCompany, setByCompany] = useState<UsageRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function token() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const accessToken = await token();
      if (!accessToken) throw new Error("Please sign in.");

      const response = await fetch("/api/platform-admin/analyzer-settings", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load settings.");

      setLimitsEnabled(result.settings?.limits_enabled !== false);
      setCompanyDailyLimit(result.settings?.company_daily_limit || 100);
      setUserHourlyLimit(result.settings?.user_hourly_limit || 20);
      setToday(result.usage?.today || 0);
      setMonth(result.usage?.month || 0);
      setByCompany(result.usage?.by_company || []);
    } catch (e: any) {
      setError(e?.message || "Could not load analyzer settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const accessToken = await token();
      if (!accessToken) throw new Error("Please sign in.");

      const response = await fetch("/api/platform-admin/analyzer-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          limitsEnabled,
          companyDailyLimit,
          userHourlyLimit,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save settings.");
      setMessage("Email Risk Analyzer limits saved.");
    } catch (e: any) {
      setError(e?.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">MicroSECONDS Platform</div>
          <h1 className="mt-1 text-4xl font-bold">Email Analyzer Settings</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Configure usage protection and review Email Risk Analyzer activity.
          </p>
        </div>
        <Link
          href="/platform-admin"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
        >
          Back to Platform Admin
        </Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div> : null}
      {message ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">{message}</div> : null}

      {loading ? (
        <div className="mt-8 text-slate-400">Loading analyzer settings...</div>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Usage Limits</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Platform Admin is exempt from these limits.
                </p>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={limitsEnabled}
                  onChange={(e) => setLimitsEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                Limits enabled
              </label>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-slate-300">Company analyses per day</span>
                <input
                  type="number"
                  min={1}
                  value={companyDailyLimit}
                  onChange={(e) => setCompanyDailyLimit(Number(e.target.value))}
                  disabled={!limitsEnabled}
                  className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 disabled:opacity-50"
                />
                <span className="text-xs text-slate-500">
                  Shared across all employees and owners in one company.
                </span>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-slate-300">Individual analyses per hour</span>
                <input
                  type="number"
                  min={1}
                  value={userHourlyLimit}
                  onChange={(e) => setUserHourlyLimit(Number(e.target.value))}
                  disabled={!limitsEnabled}
                  className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 disabled:opacity-50"
                />
                <span className="text-xs text-slate-500">
                  Helps prevent scripts, compromised accounts, and accidental excessive use.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Analyzer Settings"}
            </button>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Analyzer Usage</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Successful/started analysis requests recorded by the server.
                </p>
              </div>
              <button
                onClick={load}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                Refresh Usage
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
                <div className="text-3xl font-bold text-cyan-300">{today}</div>
                <div className="mt-1 text-sm text-slate-400">Analyses today</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
                <div className="text-3xl font-bold text-cyan-300">{month}</div>
                <div className="mt-1 text-sm text-slate-400">Analyses this month</div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-[1fr_auto] bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Company</div>
                <div>This month</div>
              </div>
              {byCompany.length ? (
                byCompany.map((row) => (
                  <div
                    key={row.company_id}
                    className="grid grid-cols-[1fr_auto] border-t border-white/10 px-4 py-3 text-sm"
                  >
                    <div className="text-slate-200">{row.company_name}</div>
                    <div className="font-semibold text-cyan-300">{row.count}</div>
                  </div>
                ))
              ) : (
                <div className="border-t border-white/10 px-4 py-5 text-sm text-slate-500">
                  No company analyzer usage recorded yet.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
