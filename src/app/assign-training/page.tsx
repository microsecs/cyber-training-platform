"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

type Course = { id: string; title: string };
type Employee = { user_id: string; email: string | null; full_name: string | null };

export default function AssignTrainingPage() {
  const { company, loading } = useCompany();
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [courseId, setCourseId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [quizRequired, setQuizRequired] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!company) return;
    const s = createClient();

    (async () => {
      const courseResult = await s
        .from("courses")
        .select("id,title")
        .eq("is_active", true)
        .order("title");

      const memberResult = await s
        .from("memberships")
        .select("user_id")
        .eq("company_id", company.companyId)
        .eq("role", "employee");

      const userIds = (memberResult.data ?? []).map((m) => m.user_id);
      let profiles: any[] = [];

      if (userIds.length) {
        const profileResult = await s
          .from("profiles")
          .select("id,email,full_name")
          .in("id", userIds);
        profiles = profileResult.data ?? [];
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      setCourses((courseResult.data as Course[]) ?? []);
      setEmployees(
        userIds.map((id) => ({
          user_id: id,
          email: profileMap.get(id)?.email ?? null,
          full_name: profileMap.get(id)?.full_name ?? null,
        }))
      );
    })();
  }, [company]);

  if (loading) return <main className="p-10">Loading...</main>;
  if (!company || company.role === "employee") {
    return <main className="p-10">Admin access required.</main>;
  }

  function toggleEmployee(userId: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? Array.from(new Set([...current, userId]))
        : current.filter((id) => id !== userId)
    );
  }

  async function assignTraining() {
    setBusy(true);
    setMessage("");

    const s = createClient();
    const { data } = await s.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setMessage("Your session expired. Please sign in again.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        courseId,
        userIds: selected,
        dueDate,
        quizRequired,
        remindersEnabled,
      }),
    });

    const result = await response.json();

    setMessage(
      response.ok
        ? `Assigned training to ${result.count} employee(s). ${
            result.remindersEnabled
              ? "Automatic reminders are enabled."
              : "Automatic reminders are off."
          }`
        : result.error || "Could not assign training."
    );

    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="text-sm text-cyan-300">{company.companyName}</div>
      <h1 className="mt-1 text-4xl font-bold">Assign Training</h1>

      <section className="mt-8 space-y-7 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div>
          <label className="mb-2 block text-sm">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg bg-slate-950 p-3"
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-3 flex justify-between">
            <label className="text-sm">Employees</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSelected(employees.map((e) => e.user_id))}
                className="text-sm text-cyan-300"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-sm text-slate-400"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {employees.map((employee) => {
              const label = employee.full_name || employee.email || employee.user_id;
              return (
                <label key={employee.user_id} className="flex gap-3 rounded-lg bg-slate-950 p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(employee.user_id)}
                    onChange={(e) => toggleEmployee(employee.user_id, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm">
            Due Date <span className="text-slate-500">(optional)</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              const value = e.target.value;
              setDueDate(value);
              setRemindersEnabled(Boolean(value));
            }}
            className="rounded-lg bg-slate-950 p-3"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={quizRequired}
              onChange={(e) => setQuizRequired(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Require Quiz</div>
              <div className="mt-1 text-sm text-slate-400">
                Turn this off if the employee only needs to review the training content.
              </div>
            </div>
          </label>
        </div>

        <div className={`rounded-xl border border-white/10 bg-slate-950 p-4 ${!dueDate ? "opacity-50" : ""}`}>
          <label className={`flex items-start gap-3 ${dueDate ? "cursor-pointer" : "cursor-not-allowed"}`}>
            <input
              type="checkbox"
              checked={remindersEnabled}
              disabled={!dueDate}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Automatic Reminders</div>
              <div className="mt-1 text-sm text-slate-400">
                {dueDate
                  ? "Send reminders 3 days before the due date, on the due date, and once if overdue."
                  : "Choose a due date to enable automatic reminders."}
              </div>
            </div>
          </label>
        </div>

        <button
          type="button"
          disabled={!courseId || !selected.length || busy}
          onClick={assignTraining}
          className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40"
        >
          {busy ? "Assigning..." : "Assign Training"}
        </button>

        {message && <div className="rounded-lg bg-slate-950 p-4 text-sm">{message}</div>}
      </section>
    </main>
  );
}
