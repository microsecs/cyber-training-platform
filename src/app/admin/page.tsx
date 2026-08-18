"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

export default function AdminPage() {
  const { company, loading, error } = useCompany();
  const [members, setMembers] = useState(0);
  const [invites, setInvites] = useState(0);
  const [assignments, setAssignments] = useState(0);

  useEffect(() => {
    if (!company) return;
    const s = createClient();

    Promise.all([
      s.from("memberships").select("id", { count: "exact", head: true }).eq("company_id", company.companyId),
      s.from("invitations").select("id", { count: "exact", head: true }).eq("company_id", company.companyId).eq("status", "pending"),
      s.from("assignments").select("id", { count: "exact", head: true }).eq("company_id", company.companyId),
    ]).then(([m, i, a]) => {
      setMembers(m.count ?? 0);
      setInvites(i.count ?? 0);
      setAssignments(a.count ?? 0);
    });
  }, [company]);

  if (loading) return <main className="mx-auto max-w-7xl px-6 pt-6 pb-12">Loading company...</main>;
  if (error || !company) return <main className="mx-auto max-w-7xl px-6 pt-6 pb-12">Please sign in first.</main>;

  if (company.role === "employee") {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-6 pb-12">
        <h1 className="text-3xl font-bold">Employee account</h1>
        <p className="mt-3 text-slate-400">You do not have company administration access.</p>
        <Link href="/employee" className="mt-6 inline-block rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950">
          Open My Training
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pt-6 pb-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-cyan-300">{company.companyName}</div>
          <h1 className="mt-1 text-4xl font-bold">Company Admin Dashboard</h1>
          <p className="mt-2 text-slate-400">Manage employees, invitations, and training assignments.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/employees" className="rounded-lg border border-white/15 px-4 py-3 font-semibold hover:bg-white/5">
            Manage Employees
          </Link>
          <Link href="/assign-training" className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
            Assign Training
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <StatCard label="Company Users" value={String(members)} detail="Real membership records" />
        <StatCard label="Pending Invitations" value={String(invites)} detail="Awaiting acceptance" />
        <StatCard label="Training Assignments" value={String(assignments)} detail="Company assignments" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Link href="/employees" className="rounded-2xl border border-white/10 bg-slate-900 p-6 hover:border-cyan-400/40">
          <div className="text-lg font-semibold">Employees</div>
          <p className="mt-2 text-sm text-slate-400">Invite users and manage company memberships.</p>
        </Link>

        <Link href="/assign-training" className="rounded-2xl border border-white/10 bg-slate-900 p-6 hover:border-cyan-400/40">
          <div className="text-lg font-semibold">Assign Training</div>
          <p className="mt-2 text-sm text-slate-400">Select a course, choose employees, and set an optional due date.</p>
        </Link>

        <Link href="/training" className="rounded-2xl border border-white/10 bg-slate-900 p-6 hover:border-cyan-400/40">
          <div className="text-lg font-semibold">Training Library</div>
          <p className="mt-2 text-sm text-slate-400">Review the cybersecurity courses currently available.</p>
        </Link>
      </div>
    </main>
  );
}
