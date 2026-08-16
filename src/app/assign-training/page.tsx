"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

type Course = { id: string; title: string };

type Member = {
  user_id: string;
  role: string;
  profiles:
    | { email: string | null; full_name: string | null }
    | { email: string | null; full_name: string | null }[]
    | null;
};

export default function AssignTrainingPage() {
  const { company, loading } = useCompany();
  const [courses, setCourses] = useState<Course[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [courseId, setCourseId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!company) return;
    const s = createClient();

    Promise.all([
      s.from("courses").select("id,title").eq("is_active", true).order("title"),
      s.from("memberships")
        .select("user_id,role,profiles!memberships_user_id_fkey(email,full_name)")
        .eq("company_id", company.companyId)
        .eq("role", "employee")
        .order("created_at"),
    ]).then(([courseResult, memberResult]) => {
      setCourses((courseResult.data as Course[]) ?? []);
      setMembers((memberResult.data as Member[]) ?? []);
    });
  }, [company]);

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-10">Loading...</main>;
  if (!company || company.role === "employee") return <main className="mx-auto max-w-5xl px-6 py-10">Admin access required.</main>;

  function toggleUser(userId: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, userId] : current.filter((id) => id !== userId)
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
      body: JSON.stringify({ courseId, userIds: selected, dueDate }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Could not assign training.");
      setBusy(false);
      return;
    }

    setMessage(`Assigned training to ${result.count} employee(s).`);
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="text-sm text-cyan-300">{company.companyName}</div>
      <h1 className="mt-1 text-4xl font-bold">Assign Training</h1>
      <p className="mt-2 text-slate-400">Choose a course and assign it to one or more employees.</p>

      <section className="mt-8 space-y-7 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Training Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 p-3">
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm text-slate-300">Employees</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setSelected(members.map((m) => m.user_id))} className="text-sm text-cyan-300 hover:text-cyan-200">
                Select All
              </button>
              <button type="button" onClick={() => setSelected([])} className="text-sm text-slate-400 hover:text-white">
                Clear
              </button>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="rounded-lg bg-slate-950 p-4 text-sm text-slate-500">No employee accounts are available yet.</div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                const label = profile?.full_name || profile?.email || member.user_id;

                return (
                  <label key={member.user_id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-slate-950 p-4 hover:border-white/15">
                    <input
                      type="checkbox"
                      checked={selected.includes(member.user_id)}
                      onChange={(e) => toggleUser(member.user_id, e.target.checked)}
                    />
                    <div>
                      <div className="font-medium">{label}</div>
                      {profile?.full_name && profile?.email ? (
                        <div className="text-xs text-slate-500">{profile.email}</div>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Due Date <span className="text-slate-500">(optional)</span></label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-white/10 bg-slate-950 p-3" />
        </div>

        <button
          type="button"
          disabled={!courseId || selected.length === 0 || busy}
          onClick={assignTraining}
          className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40"
        >
          {busy ? "Assigning..." : "Assign Training"}
        </button>

        {message && (
          <div className="rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">{message}</div>
        )}
      </section>
    </main>
  );
}
