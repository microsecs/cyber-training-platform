"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

type Member = {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  email?: string;
  full_name?: string;
};

export default function EmployeesPage() {
  const { company, loading, error } = useCompany();
  const [invites, setInvites] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  async function refresh() {
    if (!company) return;
    const s = createClient();

    const [{ data: inviteData }, { data: memberData }] = await Promise.all([
      s.from("invitations")
        .select("id,email,role,status,created_at")
        .eq("company_id", company.companyId)
        .order("created_at", { ascending: false }),

      s.from("memberships")
        .select("id,user_id,role,is_active,created_at")
        .eq("company_id", company.companyId)
        .order("created_at", { ascending: true }),
    ]);

    const rawMembers = (memberData ?? []) as Member[];
    const employeeIds = rawMembers
      .filter((m) => m.role === "employee")
      .map((m) => m.user_id);

    let profiles: any[] = [];
    if (employeeIds.length) {
      const { data } = await s
        .from("profiles")
        .select("id,email,full_name")
        .in("id", employeeIds);
      profiles = data ?? [];
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    setMembers(
      rawMembers.map((m) => ({
        ...m,
        email: profileMap.get(m.user_id)?.email ?? "",
        full_name: profileMap.get(m.user_id)?.full_name ?? "",
      }))
    );
    setInvites(inviteData ?? []);
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

  async function employeeAction(
    member: Member,
    action: "deactivate" | "reactivate" | "delete"
  ) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setMessage("Your session expired. Please sign in again.");
      return;
    }

    let confirmation: string | undefined;

    if (action === "delete") {
      const label = member.full_name || member.email || member.user_id;
      confirmation = window.prompt(
        `PERMANENTLY DELETE ${label}?\n\nThis removes their assignments, completions, reminder history, profile, company membership, invitations, and Supabase login. This cannot be undone.\n\nType DELETE to continue:`
      ) ?? undefined;

      if (confirmation !== "DELETE") return;
    } else if (action === "deactivate") {
      const ok = window.confirm(
        "Deactivate this employee? Their training history will be preserved, but they will lose company access and automatic reminders will stop."
      );
      if (!ok) return;
    }

    setActionBusy(member.id);
    setMessage("");

    const response = await fetch(`/api/employees/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        membershipId: member.id,
        confirmation,
      }),
    });

    const result = await response.json();

    setMessage(
      response.ok
        ? action === "delete"
          ? "Employee permanently deleted."
          : action === "deactivate"
          ? "Employee deactivated."
          : "Employee reactivated."
        : result.error || "Employee action failed."
    );

    if (response.ok) await refresh();
    setActionBusy(null);
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

  const employees = members.filter((m) => m.role === "employee");
  const admins = members.filter((m) => m.role !== "employee");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <div className="text-sm text-cyan-300">{company.companyName}</div>
        <h1 className="mt-1 text-4xl font-bold">Employees</h1>
        <p className="mt-2 text-slate-400">
          Invite employees, deactivate access, or permanently delete employee data.
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

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="border-b border-white/10 px-5 py-4 font-semibold">
          Employees ({employees.length})
        </div>

        {employees.length === 0 ? (
          <div className="px-5 py-6 text-sm text-slate-500">No employees yet.</div>
        ) : (
          employees.map((m) => {
            const label = m.full_name || m.email || m.user_id;
            const isBusy = actionBusy === m.id;

            return (
              <div
                key={m.id}
                className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 text-sm last:border-0 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="font-medium text-slate-200">{label}</div>
                  {m.email && m.full_name ? (
                    <div className="mt-1 text-xs text-slate-500">{m.email}</div>
                  ) : null}
                  <div className="mt-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        m.is_active
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {m.is_active ? "Active" : "Deactivated"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {m.is_active ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => employeeAction(m, "deactivate")}
                      className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 disabled:opacity-40"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => employeeAction(m, "reactivate")}
                      className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-40"
                    >
                      Reactivate
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => employeeAction(m, "delete")}
                    className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300 disabled:opacity-40"
                  >
                    Permanently Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {admins.length > 0 ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="border-b border-white/10 px-5 py-4 font-semibold">
            Company Administrators
          </div>
          {admins.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1.4fr_.6fr] border-b border-white/10 px-5 py-4 text-sm last:border-0"
            >
              <div className="text-slate-300">{m.user_id}</div>
              <div className="text-right capitalize text-slate-400">{m.role}</div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
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
    </main>
  );
}
