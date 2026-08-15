"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

export default function EmployeesPage() {
  const { company, loading, error } = useCompany();
  const [invites, setInvites] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!company) return;
    const s = createClient();

    const [{ data: inviteData }, { data: memberData }] = await Promise.all([
      s.from("invitations")
        .select("id,email,role,status,created_at")
        .eq("company_id", company.companyId)
        .order("created_at", { ascending: false }),

      s.from("memberships")
        .select("id,user_id,role,created_at")
        .eq("company_id", company.companyId)
        .order("created_at", { ascending: true }),
    ]);

    setInvites(inviteData ?? []);
    setMembers(memberData ?? []);
  }

  useEffect(() => {
    if (company) refresh();
  }, [company]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setMessage("Your session expired. Please sign in again.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Could not send invitation");
      setBusy(false);
      return;
    }

    setEmail("");
    setMessage(result.message || "Invitation sent.");
    await refresh();
    setBusy(false);
  }

  if (loading) {
    return <main className="mx-auto max-w-7xl px-6 py-12">Loading...</main>;
  }

  if (error || !company) {
    return <main className="mx-auto max-w-7xl px-6 py-12">Please sign in first.</main>;
  }

  if (company.role === "employee") {
    return <main className="mx-auto max-w-7xl px-6 py-12">Admin access required.</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <div className="text-sm text-cyan-300">{company.companyName}</div>
        <h1 className="mt-1 text-4xl font-bold">Employees</h1>
        <p className="mt-2 text-slate-400">
          Invite employees by email and manage everyone under this company account.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Invite Employee</h2>
        <p className="mt-2 text-sm text-slate-400">
          The employee will receive an email link to activate their account and choose a password.
        </p>

        <form onSubmit={invite} className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="employee@company.com"
            className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400/50"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
          >
            {busy ? "Sending..." : "Send Invitation"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-300">
            {message}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="border-b border-white/10 px-5 py-4 font-semibold">
            Company Users ({members.length})
          </div>
          {members.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1.4fr_.6fr] border-b border-white/10 px-5 py-4 text-sm last:border-0"
            >
              <div className="text-slate-300">{m.user_id}</div>
              <div className="text-right capitalize text-slate-400">{m.role}</div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="border-b border-white/10 px-5 py-4 font-semibold">Invitations</div>
          {invites.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">No invitations yet.</div>
          ) : (
            invites.map((x) => (
              <div
                key={x.id}
                className="grid grid-cols-[1.4fr_.6fr] border-b border-white/10 px-5 py-4 text-sm last:border-0"
              >
                <div>{x.email}</div>
                <div className="text-right capitalize text-slate-400">{x.status}</div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
