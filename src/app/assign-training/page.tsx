"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";
import SubscriptionGate from "@/components/SubscriptionGate";

type Course = { id: string; title: string };
type Employee = {
  key: string;
  kind: "user" | "invite";
  id: string;
  email: string | null;
  full_name: string | null;
};

type InviteRow = {
  id: string;
  email: string;
  role: string | null;
  status: string;
};

function AssignTrainingPageContent() {
  const { company, loading } = useCompany();
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [courseId, setCourseId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [quizRequired, setQuizRequired] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!company) return;
    const s = createClient();

    (async () => {
      setLoadError("");

      const [courseResult, memberResult, inviteResult] = await Promise.all([
        s.from("courses").select("id,title").eq("is_active", true).order("title"),
        s
          .from("memberships")
          .select("user_id")
          .eq("company_id", company.companyId)
          .eq("role", "employee"),
        s
          .from("invitations")
          .select("id,email,role,status")
          .eq("company_id", company.companyId)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);

      if (courseResult.error) setLoadError(courseResult.error.message);
      if (memberResult.error) setLoadError(memberResult.error.message);
      if (inviteResult.error) setLoadError(inviteResult.error.message);

      const userIds = (memberResult.data ?? []).map((m) => m.user_id);
      let profiles: any[] = [];

      if (userIds.length) {
        const profileResult = await s
          .from("profiles")
          .select("id,email,full_name")
          .in("id", userIds);

        if (profileResult.error) setLoadError(profileResult.error.message);
        profiles = profileResult.data ?? [];
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const activeEmployees: Employee[] = userIds.map((id) => ({
        key: `user:${id}`,
        kind: "user",
        id,
        email: profileMap.get(id)?.email ?? null,
        full_name: profileMap.get(id)?.full_name ?? null,
      }));

      const pendingEmployees: Employee[] = ((inviteResult.data as InviteRow[]) ?? [])
        .filter((invite) => !invite.role || invite.role === "employee")
        .map((invite) => ({
          key: `invite:${invite.id}`,
          kind: "invite",
          id: invite.id,
          email: invite.email,
          full_name: null,
        }));

      setCourses((courseResult.data as Course[]) ?? []);
      setEmployees([...activeEmployees, ...pendingEmployees]);
    })();
  }, [company]);

  const pendingCount = useMemo(
    () => employees.filter((employee) => employee.kind === "invite").length,
    [employees]
  );

  if (loading) return <main className="p-10">Loading...</main>;
  if (!company || company.role === "employee") {
    return <main className="p-10">Admin access required.</main>;
  }

  function toggleEmployee(key: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? Array.from(new Set([...current, key]))
        : current.filter((id) => id !== key)
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
        targets: selected,
        dueDate,
        quizRequired,
        remindersEnabled,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      const pieces = [`Assigned training to ${result.count} employee(s).`];

      if (result.pendingCount > 0) {
        pieces.push(
          `${result.pendingCount} pending invitation${result.pendingCount === 1 ? "" : "s"} will receive the training automatically when accepted.`
        );
      }

      if (result.skippedActive > 0) {
        pieces.push(
          `${result.skippedActive} existing active assignment${result.skippedActive === 1 ? " was" : "s were"} skipped.`
        );
      }

      pieces.push(
        result.remindersEnabled
          ? "Automatic reminders are enabled."
          : "Automatic reminders are off."
      );

      setMessage(pieces.join(" "));
    } else {
      setMessage(result.error || "Could not assign training.");
    }

    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="text-sm text-cyan-300">{company.companyName}</div>
      <h1 className="mt-1 text-4xl font-bold">Assign Training</h1>

      <section className="mt-8 space-y-7 rounded-2xl border border-white/10 bg-slate-900 p-6">
        {loadError && (
          <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
            {loadError}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg bg-slate-950 p-3"
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="text-sm">Employees</label>
              {pendingCount > 0 && (
                <div className="mt-1 text-xs text-slate-500">
                  Pending invitees can be assigned now. Their training becomes active when they accept the invitation.
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSelected(employees.map((e) => e.key))}
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
            {employees.length === 0 ? (
              <div className="rounded-lg bg-slate-950 p-4 text-sm text-slate-400">
                No active employees or pending invitations were found.
              </div>
            ) : (
              employees.map((employee) => {
                const label = employee.full_name || employee.email || employee.id;
                return (
                  <label
                    key={employee.key}
                    className="flex items-center gap-3 rounded-lg bg-slate-950 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(employee.key)}
                      onChange={(e) => toggleEmployee(employee.key, e.target.checked)}
                    />
                    <span className="flex-1">{label}</span>
                    {employee.kind === "invite" && (
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300">
                        Invitation Pending
                      </span>
                    )}
                  </label>
                );
              })
            )}
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

        <div
          className={`rounded-xl border border-white/10 bg-slate-950 p-4 ${
            !dueDate ? "opacity-50" : ""
          }`}
        >
          <label
            className={`flex items-start gap-3 ${
              dueDate ? "cursor-pointer" : "cursor-not-allowed"
            }`}
          >
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

        {message && (
          <div className="rounded-lg bg-slate-950 p-4 text-sm">{message}</div>
        )}
      </section>
    </main>
  );
}


export default function AssignTrainingPage() {
  return (
    <SubscriptionGate>
      <AssignTrainingPageContent />
    </SubscriptionGate>
  );
}
