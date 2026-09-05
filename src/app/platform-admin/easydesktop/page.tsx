"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EasyDesktopSettingsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
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

      const token = await getToken();
      const response = await fetch("/api/easydesktop/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Could not load EasyDesktop settings. Run the included SQL patch first."
        );
      } else {
        setFileName(result.settings?.trial_file_name || "");
        setUpdatedAt(result.settings?.updated_at || null);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function uploadTrial(file: File) {
    setUploading(true);
    setMessage("");
    setError("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const signResponse = await fetch("/api/r2/easydesktop-trial-upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        }),
      });

      const signed = await signResponse.json();
      if (!signResponse.ok) {
        throw new Error(signed.error || "Could not prepare the upload.");
      }

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("The trial file could not be uploaded to storage.");
      }

      const saveResponse = await fetch("/api/easydesktop/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trialObjectKey: signed.key,
          trialFileName: file.name,
        }),
      });

      const saveResult = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveResult.error || "Could not save the trial download.");
      }

      setFileName(file.name);
      setUpdatedAt(new Date().toISOString());
      setMessage(
        "EasyDesktop trial uploaded. The public Download 15-Day Trial buttons now use this file."
      );
    } catch (uploadError: any) {
      setError(uploadError?.message || "Could not upload the EasyDesktop trial.");
    } finally {
      setUploading(false);
    }
  }

  if (loading || authorized === null) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        Loading EasyDesktop settings...
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Platform Admin Required</h1>
        <p className="mt-3 text-slate-400">
          This account does not have platform administration access.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">MicroSECONDS Platform</div>
          <h1 className="mt-1 text-4xl font-bold">EasyDesktop Settings</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Upload the 15-day EasyDesktop trial file. The public EasyDesktop page
            will automatically download the current file through MicroSECONDS.
          </p>
        </div>

        <Link
          href="/platform-admin"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
        >
          Back to Platform Admin
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-2xl font-semibold text-white">15-Day Trial Download</h2>

        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-5">
          <div className="text-sm text-slate-400">Current trial file</div>
          <div className="mt-1 font-semibold text-white">
            {fileName || "No trial file uploaded"}
          </div>
          {updatedAt ? (
            <div className="mt-2 text-xs text-slate-500">
              Last updated: {new Date(updatedAt).toLocaleString()}
            </div>
          ) : null}
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm text-slate-300">
            Upload a replacement trial file
          </span>
          <input
            type="file"
            accept=".zip,.exe,.msi,application/zip,application/x-zip-compressed,application/octet-stream"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadTrial(file);
              event.currentTarget.value = "";
            }}
            className="block w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950"
          />
        </label>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          ZIP, EXE, or MSI files up to 1 GB. Uploading a new file immediately
          replaces the public trial download without requiring a website rebuild.
        </p>

        <a
          href="/api/easydesktop/trial-download"
          className="mt-5 inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
        >
          Test Current Download
        </a>
      </section>
    </main>
  );
}
