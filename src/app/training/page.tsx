"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

export default function TrainingPage() {
  const { company } = useCompany();
  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = createClient();

    s.from("courses")
      .select("id,title,description,duration_minutes,quiz_question_count,video_url,passing_score,is_active")
      .eq("is_active", true)
      .order("title")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setCourses(data ?? []);
      });
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-cyan-300">Training Library</div>
          <h1 className="mt-1 text-4xl font-bold">Security Awareness Courses</h1>
          <p className="mt-2 text-slate-400">
            Active training content currently available to your organization.
          </p>
        </div>

        {company && company.role !== "employee" ? (
          <Link
            href="/admin/courses"
            className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            Manage Courses
          </Link>
        ) : null}
      </div>

      {error && (
        <div className="mt-6 text-rose-300">{error}</div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <article
            key={course.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
          >
            <div className="flex aspect-video items-center justify-center bg-slate-950">
              {course.video_url ? (
                <div className="text-center">
                  <div className="text-4xl">▶</div>
                  <div className="mt-2 text-sm text-slate-400">Video configured</div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No video yet</div>
              )}
            </div>

            <div className="p-5">
              <div className="text-xl font-semibold">{course.title}</div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {course.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{course.duration_minutes} min</span>
                <span>{course.quiz_question_count} questions</span>
                <span>Pass: {course.passing_score}%</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
