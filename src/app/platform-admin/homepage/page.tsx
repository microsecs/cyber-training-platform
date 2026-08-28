"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_HOMEPAGE_SETTINGS, HomepageSettings, HomepageStat } from "@/lib/homepage-config";

function rowToSettings(row: any): HomepageSettings {
  if (!row) return DEFAULT_HOMEPAGE_SETTINGS;
  return {
    heroBadge: row.hero_badge || DEFAULT_HOMEPAGE_SETTINGS.heroBadge,
    heroTitle: row.hero_title || DEFAULT_HOMEPAGE_SETTINGS.heroTitle,
    heroBody: row.hero_body || DEFAULT_HOMEPAGE_SETTINGS.heroBody,
    videoKey: row.video_key || null,
    videoUrl: row.video_url || null,
    videoTitle: row.video_title || DEFAULT_HOMEPAGE_SETTINGS.videoTitle,
    statsEyebrow: row.stats_eyebrow || DEFAULT_HOMEPAGE_SETTINGS.statsEyebrow,
    statsHeading: row.stats_heading || DEFAULT_HOMEPAGE_SETTINGS.statsHeading,
    statsBody: row.stats_body || DEFAULT_HOMEPAGE_SETTINGS.statsBody,
    stats: Array.isArray(row.stats) ? row.stats : DEFAULT_HOMEPAGE_SETTINGS.stats,
  };
}

export default function HomepageSettingsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function getToken() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function refreshPreview(key: string | null) {
    if (!key) {
      setPreviewUrl(settings.videoUrl || null);
      return;
    }
    const token = await getToken();
    if (!token) return;
    const response = await fetch(`/api/r2/admin-homepage-preview-url?key=${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (response.ok) setPreviewUrl(result.videoUrl || null);
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
      const token = await getToken();
      if (!token) {
        setError("Could not read your login session.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/homepage-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not load homepage settings. Run the included SQL patch first.");
        setLoading(false);
        return;
      }

      const loaded = rowToSettings(result.settings);
      setSettings(loaded);
      if (loaded.videoKey) {
        const previewResponse = await fetch(
          `/api/r2/admin-homepage-preview-url?key=${encodeURIComponent(loaded.videoKey)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const previewResult = await previewResponse.json();
        if (previewResponse.ok) setPreviewUrl(previewResult.videoUrl || null);
      } else {
        setPreviewUrl(loaded.videoUrl || null);
      }
      setLoading(false);
    }

    load();
  }, []);

  function updateStat(id: string, patch: Partial<HomepageStat>) {
    setSettings((current) => ({
      ...current,
      stats: current.stats.map((stat) => (stat.id === id ? { ...stat, ...patch } : stat)),
    }));
  }

  function addStat() {
    setSettings((current) => ({
      ...current,
      stats: [
        ...current.stats,
        {
          id: crypto.randomUUID(),
          value: "",
          label: "",
          detail: "",
          source: "",
          sourceDate: "",
          sourceUrl: "",
          enabled: true,
        },
      ],
    }));
  }

  function removeStat(id: string) {
    if (!confirm("Remove this statistic card from the homepage settings?")) return;
    setSettings((current) => ({ ...current, stats: current.stats.filter((stat) => stat.id !== id) }));
  }

  async function uploadVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/r2/homepage-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start upload");

      const uploadResponse = await fetch(result.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "video/mp4" },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Cloudflare R2 upload failed");

      setSettings((current) => ({ ...current, videoKey: result.key, videoUrl: null }));
      const previewResponse = await fetch(
        `/api/r2/admin-homepage-preview-url?key=${encodeURIComponent(result.key)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const previewResult = await previewResponse.json();
      if (previewResponse.ok) setPreviewUrl(previewResult.videoUrl || null);
      setMessage("Video uploaded. Click Save Homepage Settings to publish it.");
    } catch (uploadError: any) {
      setError(uploadError?.message || "Video upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeVideo() {
    if (!settings.videoKey && !settings.videoUrl) return;
    if (!confirm("Remove the homepage video? The existing R2 video will be deleted when you save.")) return;
    setSettings((current) => ({ ...current, videoKey: null, videoUrl: null }));
    setPreviewUrl(null);
    setMessage("Video marked for removal. Click Save Homepage Settings to finish.");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const enabledStats = settings.stats.filter((stat) => stat.enabled);
      for (const stat of enabledStats) {
        if (!stat.value.trim() || !stat.label.trim() || !stat.source.trim()) {
          throw new Error("Each enabled statistic needs a value, description, and source.");
        }
      }

      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/admin/homepage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save homepage settings");

      setMessage("Homepage settings saved. The public homepage is updated.");
      if (settings.videoKey) await refreshPreview(settings.videoKey);
    } catch (saveError: any) {
      setError(saveError?.message || "Could not save homepage settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || authorized === null) {
    return <main className="mx-auto max-w-6xl px-6 py-12">Loading homepage settings...</main>;
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
          <h1 className="mt-1 text-4xl font-bold">Homepage Settings</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Manage the public homepage video, marketing copy, and cybersecurity statistics without editing source code.
          </p>
        </div>
        <Link href="/platform-admin" className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
          Back to Platform Admin
        </Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div> : null}
      {message ? <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">{message}</div> : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Hero Section</h2>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Small headline</span>
            <input value={settings.heroBadge} onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Main headline</span>
            <textarea rows={2} value={settings.heroTitle} onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Introductory text</span>
            <textarea rows={3} value={settings.heroBody} onChange={(e) => setSettings({ ...settings, heroBody: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Homepage Video</h2>
            <p className="mt-1 text-sm text-slate-400">Upload a promotional MP4/WebM video to Cloudflare R2.</p>
          </div>
          <div className="flex gap-3">
            <label className="cursor-pointer rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
              {uploading ? "Uploading..." : settings.videoKey ? "Replace Video" : "Upload Video"}
              <input type="file" accept="video/*" className="hidden" disabled={uploading} onChange={uploadVideo} />
            </label>
            {(settings.videoKey || settings.videoUrl) ? (
              <button type="button" onClick={removeVideo} className="rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10">
                Remove Video
              </button>
            ) : null}
          </div>
        </div>

        {previewUrl ? (
          <video key={previewUrl} controls playsInline preload="metadata" className="mt-5 aspect-video w-full max-w-3xl rounded-xl bg-black object-contain">
            <source src={previewUrl} />
          </video>
        ) : (
          <div className="mt-5 flex aspect-video max-w-3xl items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-950 text-sm text-slate-500">
            No homepage video selected
          </div>
        )}

        <label className="mt-5 grid gap-2 text-sm">
          <span className="text-slate-300">Video title shown below the player</span>
          <input value={settings.videoTitle} onChange={(e) => setSettings({ ...settings, videoTitle: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
        </label>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Statistics Section</h2>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Section label</span>
            <input value={settings.statsEyebrow} onChange={(e) => setSettings({ ...settings, statsEyebrow: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Statistics headline</span>
            <textarea rows={2} value={settings.statsHeading} onChange={(e) => setSettings({ ...settings, statsHeading: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Statistics introduction</span>
            <textarea rows={3} value={settings.statsBody} onChange={(e) => setSettings({ ...settings, statsBody: e.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2" />
          </label>
        </div>

        <div className="mt-7 space-y-5">
          {settings.stats.map((stat, index) => (
            <div key={stat.id} className="rounded-xl border border-white/10 bg-slate-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold">Statistic {index + 1}</div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={stat.enabled} onChange={(e) => updateStat(stat.id, { enabled: e.target.checked })} />
                    Show on homepage
                  </label>
                  <button type="button" onClick={() => removeStat(stat.id)} className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10">
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-400">Big number / value</span>
                  <input value={stat.value} onChange={(e) => updateStat(stat.id, { value: e.target.value })} placeholder="8.3 BILLION" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-400">Source</span>
                  <input value={stat.source} onChange={(e) => updateStat(stat.id, { source: e.target.value })} placeholder="Microsoft Security" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span className="text-slate-400">Statistic description</span>
                  <input value={stat.label} onChange={(e) => updateStat(stat.id, { label: e.target.value })} placeholder="email-based phishing threats detected..." className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span className="text-slate-400">Supporting detail</span>
                  <textarea rows={2} value={stat.detail || ""} onChange={(e) => updateStat(stat.id, { detail: e.target.value })} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-400">Source date</span>
                  <input value={stat.sourceDate || ""} onChange={(e) => updateStat(stat.id, { sourceDate: e.target.value })} placeholder="Q1 2026" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-400">Source link</span>
                  <input type="url" value={stat.sourceUrl || ""} onChange={(e) => updateStat(stat.id, { sourceUrl: e.target.value })} placeholder="https://..." className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2" />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addStat} className="mt-5 rounded-lg border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-400/10">
          + Add Statistic
        </button>
      </section>

      <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
        <div className="text-sm text-slate-400">Changes are not public until you save.</div>
        <button type="button" disabled={saving || uploading} onClick={save} className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
          {saving ? "Saving..." : "Save Homepage Settings"}
        </button>
      </div>
    </main>
  );
}
