"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CoursePage(){
  const id=useParams().id as string;
  const [assignment,setAssignment]=useState<any>(null);
  const [videoUrl,setVideoUrl]=useState("");
  const [videoError,setVideoError]=useState("");

  useEffect(()=>{
    const s=createClient();
    (async()=>{
      const {data:u}=await s.auth.getUser();
      if(!u.user)return;
      const {data:a}=await s.from("assignments")
        .select("id,status,quiz_required,courses(title,description,duration_minutes,quiz,passing_score),completions(score,completed_at)")
        .eq("id",id).eq("user_id",u.user.id).single();
      setAssignment(a);
      const {data:sess}=await s.auth.getSession();
      if(sess.session){
        const r=await fetch(`/api/r2/video-url?assignmentId=${encodeURIComponent(id)}`,{
          headers:{Authorization:`Bearer ${sess.session.access_token}`}
        });
        const x=await r.json();
        if(r.ok)setVideoUrl(x.videoUrl);else setVideoError(x.error||"Video unavailable.");
      }
    })();
  },[id]);

  if(!assignment)return <main className="p-10">Loading course...</main>;
  const c=Array.isArray(assignment.courses)?assignment.courses[0]:assignment.courses;

  return <main className="mx-auto max-w-4xl px-6 py-10">
    <div className="text-sm text-cyan-300">Training Course</div>
    <h1 className="mt-1 text-4xl font-bold">{c?.title}</h1>
    <p className="mt-3 text-slate-400">{c?.description}</p>
    <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
      {videoUrl
        ? <video controls src={videoUrl} className="aspect-video w-full rounded-xl bg-black"/>
        : <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-950 text-slate-400">{videoError||"Loading secure video..."}</div>}
    </section>
    <div className="mt-6 rounded-lg border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
      Your existing quiz/completion UI can remain below this secure video player.
    </div>
  </main>;
}
