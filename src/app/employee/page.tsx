"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Assignment = {
  id: string;
  status: "not_started" | "in_progress" | "completed";
  due_date: string | null;
  created_at: string;
  courses:
    | {
        id: string;
        title: string;
        description: string | null;
        duration_minutes: number;
      }
    | {
        id: string;
        title: string;
        description: string | null;
        duration_minutes: number;
      }[]
    | null;
  completions:
    | {
        score: number | null;
        completed_at: string;
      }
    | {
        score: number | null;
        completed_at: string;
      }[]
    | null;
};

export default function EmployeeDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function loadTraining() {
      setLoading(true);
      setError("");

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("Please sign in to view your training.");
        setLoading(false);
        return;
      }

      setEmail(userData.user.email ?? "");

      const { data, error: assignmentError } = await supabase
        .from("assignments")
        .select(
          "id,status,due_date,created_at,courses(id,title,description,duration_minutes),completions(score,completed_at)"
        )
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (assignmentError) {
        setError(assignmentError.message);
        setLoading(false);
        return;
      }

      setAssignments((data as Assignment[]) ?? []);
      setLoading(false);
    }

    loadTraining();
  }, []);

  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter(
      (a) => a.status === "completed"
    ).length;
    const overdue = assignments.filter((a) => {
      if (!a.due_date || a.status === "completed") return false;
      return new Date(a.due_date + "T23:59:59") < new Date();
    }).length;

    return { total, completed, overdue };
  }, [assignments]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        Loading your training...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
        <div className="text-sm text-cyan-300">Employee Training Portal</div>
        <h1 className="mt-1 text-4xl font-bold">My Training</h1>
        <p className="mt-2 text-slate-400">
          {email || "Signed-in employee"}
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <div className="text-sm text-slate-400">Assigned</div>
              <div className="mt-2 text-3xl font-bold">{stats.total}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <div className="text-sm text-slate-400">Completed</div>
              <div className="mt-2 text-3xl font-bold">{stats.completed}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <div className="text-sm text-slate-400">Overdue</div>
              <div className="mt-2 text-3xl font-bold">{stats.overdue}</div>
            </div>
          </div>

          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Assigned Courses</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Complete each course and pass its quiz with 80% or better.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {assignments.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-slate-400">
                  No training has been assigned yet.
                </div>
              ) : (
                assignments.map((assignment) => {
                  const course = Array.isArray(assignment.courses)
                    ? assignment.courses[0]
                    : assignment.courses;

                  const completion = Array.isArray(assignment.completions)
                    ? assignment.completions[0]
                    : assignment.completions;

                  const overdue =
                    !!assignment.due_date &&
                    assignment.status !== "completed" &&
                    new Date(assignment.due_date + "T23:59:59") <
                      new Date();

                  const statusLabel =
                    assignment.status === "completed"
                      ? "Completed"
                      : overdue
                      ? "Overdue"
                      : assignment.status === "in_progress"
                      ? "In Progress"
                      : "Not Started";

                  return (
                    <article
                      key={assignment.id}
                      className="rounded-2xl border border-white/10 bg-slate-900 p-6"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold">
                              {course?.title || "Training Course"}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${
                                assignment.status === "completed"
                                  ? "bg-emerald-400/10 text-emerald-300"
                                  : overdue
                                  ? "bg-rose-400/10 text-rose-300"
                                  : assignment.status === "in_progress"
                                  ? "bg-amber-400/10 text-amber-300"
                                  : "bg-white/10 text-slate-300"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-400">
                            {course?.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                            {course?.duration_minutes ? (
                              <span>
                                {course.duration_minutes} minute lesson
                              </span>
                            ) : null}

                            {assignment.due_date ? (
                              <span>
                                Due{" "}
                                {new Date(
                                  assignment.due_date + "T00:00:00"
                                ).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>No due date</span>
                            )}

                            {completion?.score != null ? (
                              <span>Quiz score: {completion.score}%</span>
                            ) : null}
                          </div>

                          {completion?.completed_at ? (
                            <div className="mt-2 text-xs text-slate-500">
                              Completed{" "}
                              {new Date(
                                completion.completed_at
                              ).toLocaleString()}
                            </div>
                          ) : null}
                        </div>

                        <div className="shrink-0">
                          {assignment.status === "completed" ? (
                            <Link
                              href={`/course/${assignment.id}`}
                              className="inline-block rounded-lg border border-white/15 px-4 py-3 font-semibold hover:bg-white/5"
                            >
                              Review Course
                            </Link>
                          ) : (
                            <Link
                              href={`/course/${assignment.id}`}
                              className="inline-block rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
                            >
                              {assignment.status === "in_progress"
                                ? "Continue Training"
                                : "Start Training"}
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
