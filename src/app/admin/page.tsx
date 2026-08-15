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
      s.from("memberships").select("id",{count:"exact",head:true}).eq("company_id",company.companyId),
      s.from("invitations").select("id",{count:"exact",head:true}).eq("company_id",company.companyId).eq("status","pending"),
      s.from("assignments").select("id",{count:"exact",head:true}).eq("company_id",company.companyId),
    ]).then(([m,i,a]) => {
      setMembers(m.count ?? 0); setInvites(i.count ?? 0); setAssignments(a.count ?? 0);
    });
  }, [company]);

  if (loading) return <main className="mx-auto max-w-7xl px-6 py-12">Loading company...</main>;
  if (error || !company) return <main className="mx-auto max-w-7xl px-6 py-12">Please sign in first.</main>;
  if (company.role === "employee") return <main className="mx-auto max-w-7xl px-6 py-12">Admin access required.</main>;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">{company.companyName}</div>
          <h1 className="mt-1 text-4xl font-bold">Company Admin Dashboard</h1>
          <p className="mt-2 text-slate-400">Real company data from Supabase.</p>
        </div>
        <Link href="/employees" className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950">Manage Employees</Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <StatCard label="Company Users" value={String(members)} detail="Real membership records" />
        <StatCard label="Pending Invitations" value={String(invites)} detail="Awaiting acceptance" />
        <StatCard label="Training Assignments" value={String(assignments)} detail="Company assignments" />
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="text-sm text-emerald-300">✓ Multi-company database connected</div>
        <h2 className="mt-2 text-xl font-semibold">Company records are protected by Row Level Security</h2>
      </section>
    </main>
  );
}
