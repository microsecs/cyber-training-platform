"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrainingPage() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const s = createClient();

    s.from("courses")
      .select("id,title,description,duration_minutes,quiz_question_count,passing_score,video_url")
      .eq("is_active", true)
      .order("title")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-sm text-cyan-300">Training Library</div>
      <h1 className="mt-1 text-4xl font-bold">Security Awareness Courses</h1>
      <p className="mt-2 text-slate-400">
        Company administrators can assign these courses, but only the platform owner can edit them.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <article
            key={course.id}
            className="rounded-2xl border border-white/10 bg-slate-900 p-5"
          >
            <div className="text-xl font-semibold">{course.title}</div>
            <p className="mt-3 text-sm text-slate-400">{course.description}</p>
            <div className="mt-4 text-xs text-slate-500">
              {course.duration_minutes} min • {course.quiz_question_count} questions • Default pass {course.passing_score}%
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
