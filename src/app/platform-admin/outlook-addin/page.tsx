"use client";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OutlookAddinAdminPage() {
  const [uploaded,setUploaded]=useState(false);
  const [updatedAt,setUpdatedAt]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function token(){const s=createClient();const {data}=await s.auth.getSession();return data.session?.access_token||null;}
  async function load(){
    try { const t=await token(); if(!t) throw new Error("Please sign in.");
      const r=await fetch("/api/platform-admin/outlook-addin",{headers:{Authorization:`Bearer ${t}`}});
      const j=await r.json(); if(!r.ok) throw new Error(j.error||"Could not load Outlook add-in settings.");
      setUploaded(Boolean(j.uploaded));setUpdatedAt(j.updatedAt||null);
    } catch(e:any){setError(e?.message||"Could not load settings.");}
  }
  useEffect(()=>{load();},[]);
  async function upload(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; e.target.value=""; if(!file)return;
    setBusy(true);setError("");setMessage("");
    try { const t=await token();if(!t)throw new Error("Please sign in.");
      const f=new FormData();f.append("file",file);
      const r=await fetch("/api/platform-admin/outlook-addin",{method:"POST",headers:{Authorization:`Bearer ${t}`},body:f});
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Could not upload manifest.");
      setMessage("Outlook add-in download file updated.");await load();
    }catch(e:any){setError(e?.message||"Could not upload manifest.");}finally{setBusy(false);}
  }
  return <main className="mx-auto max-w-4xl px-6 py-10">
    <div className="flex items-start justify-between gap-4"><div><div className="text-sm text-cyan-300">MicroSECONDS Platform</div>
      <h1 className="mt-1 text-4xl font-bold">Outlook Add-in Download</h1>
      <p className="mt-2 text-slate-400">Replace the Outlook XML manifest offered on the Email Analyzer installation page without rebuilding the website.</p></div>
      <Link href="/platform-admin" className="rounded-lg border border-white/15 px-4 py-2 text-sm">Back to Platform Admin</Link></div>
    {error?<div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">{error}</div>:null}
    {message?<div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">{message}</div>:null}
    <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Current download file</h2>
      <p className="mt-2 text-sm text-slate-400">{uploaded?"A Platform Admin uploaded manifest is active.":"The bundled default Outlook manifest is currently being used."}</p>
      {updatedAt?<p className="mt-1 text-xs text-slate-500">Last uploaded: {new Date(updatedAt).toLocaleString()}</p>:null}
      <div className="mt-5 flex flex-wrap gap-3">
        <label className="cursor-pointer rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
          {busy?"Uploading...":"Upload New Outlook Manifest"}
          <input type="file" accept=".xml,application/xml,text/xml" className="hidden" disabled={busy} onChange={upload}/>
        </label>
        <a href="/api/outlook-addin/download" className="rounded-lg border border-white/15 px-5 py-3 font-semibold hover:border-cyan-400/40">Download Current File</a>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Uploading replaces only the downloadable manifest. It does not modify the Outlook task pane, Email Analyzer API, Gmail add-in, or Google OAuth configuration.</p>
    </section>
  </main>;
}
