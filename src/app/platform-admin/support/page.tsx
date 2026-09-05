"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SupportSettingsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [supportEmail, setSupportEmail] = useState("support@microseconds.com");
  const [remotePcSupportUrl, setRemotePcSupportUrl] = useState("");
  const [remoteMacSupportUrl, setRemoteMacSupportUrl] = useState("");
  const [easyDesktopUrl, setEasyDesktopUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function getToken() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: adminRow } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!adminRow) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      const response = await fetch("/api/support-settings");
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not load support settings. Run the included SQL patch first.");
        setLoading(false);
        return;
      }

      setSupportEmail(result.settings?.support_email || "support@microseconds.com");
      setRemotePcSupportUrl(result.settings?.remote_pc_support_url || "");
      setRemoteMacSupportUrl(result.settings?.remote_mac_support_url || "");
      setEasyDesktopUrl(result.settings?.easydesktop_url || "");
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/support-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ supportEmail, remotePcSupportUrl, remoteMacSupportUrl, easyDesktopUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save support settings");
      setMessage("Support settings saved. The public Support page is updated.");
    } catch (saveError: any) {
      setError(saveError?.message || "Could not save support settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || authorized === null) {
    return <main className="mx-auto max-w-6xl px-6 py-12">Loading support settings...</main>;
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Platform Admin Required</h1>
        <p className="mt-3 text-slate-400">This account does not have platform administration access.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">MicroSECONDS Platform</div>
          <h1 className="mt-1 text-4xl font-bold">Support Settings</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Configure the contact email and remote-support links shown on the public Support page.
          </p>
        </div>
        <Link href="/platform-admin" className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
          Back to Platform Admin
        </Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div> : null}
      {message ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">{message}</div> : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Support email</span>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Remote PC Support URL</span>
            <input
              type="url"
              value={remotePcSupportUrl}
              onChange={(e) => setRemotePcSupportUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2"
            />
            <span className="text-xs text-slate-500">Leave blank to hide the Windows support button.</span>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Remote Mac Support URL</span>
            <input
              type="url"
              value={remoteMacSupportUrl}
              onChange={(e) => setRemoteMacSupportUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2"
            />
            <span className="text-xs text-slate-500">Leave blank to hide the Mac support button.</span>
          </label>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Support Settings"}
        </button>
      </section>
    </main>
  );
}
