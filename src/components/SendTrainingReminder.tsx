"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
export default function SendTrainingReminder({assignmentId,disabled=false}:{assignmentId:string;disabled?:boolean}){
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 async function send(){
  setBusy(true);setMsg("");
  const s=createClient(); const {data}=await s.auth.getSession();
  const r=await fetch("/api/reminders/send",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${data.session?.access_token}`},body:JSON.stringify({assignmentId})});
  const x=await r.json(); setMsg(r.ok?"Reminder sent.":x.error||"Could not send.");setBusy(false);
 }
 return <div><button onClick={send} disabled={disabled||busy} className="w-28 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-40">{busy?"Sending...":"Send Reminder"}</button>{msg&&<div className="mt-1 text-xs text-slate-500">{msg}</div>}</div>;
}