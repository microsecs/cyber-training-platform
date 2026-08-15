"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrainingPage() {
  const [courses,setCourses] = useState<any[]>([]);
  const [error,setError] = useState("");

  useEffect(()=>{
    const s=createClient();
    s.from("courses")
      .select("id,title,description,duration_minutes,quiz_question_count")
      .eq("is_active",true)
      .order("title")
      .then(({data,error})=>{
        if(error) setError(error.message);
        else setCourses(data ?? []);
      });
  },[]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-sm text-cyan-300">Training Library</div>
      <h1 className="mt-1 text-4xl font-bold">Security Awareness Courses</h1>
      <p className="mt-2 text-slate-400">These records are now loaded from Supabase.</p>

      {error && <div className="mt-6 text-rose-300">{error}</div>}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c)=>(
          <article key={c.id} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="text-xl font-semibold">{c.title}</div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{c.description}</p>
            <div className="mt-4 text-xs text-slate-500">{c.duration_minutes} min • {c.quiz_question_count} quiz questions</div>
          </article>
        ))}
      </div>
    </main>
  );
}
