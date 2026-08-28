"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

export default function EmployeesPage() {
  const { company, loading, error } = useCompany();
  const [invites, setInvites] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loadError, setLoadError] = useState("");
  const [employeeAction, setEmployeeAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteAction, setInviteAction] = useState<string | null>(null);

  async function refresh() {
    if (!company) return;
    const supabase = createClient();
    setLoadError("");

    const [inviteResult, memberResult] = await Promise.all([
      supabase
        .from("invitations")
        .select("id,email,role,status,created_at")
        .eq("company_id", company.companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),

      supabase
        .from("memberships")
        .select("id,user_id,role,created_at")
        .eq("company_id", company.companyId)
        .order("created_at", { ascending: true }),
    ]);

    if (inviteResult.error) {
      setLoadError(inviteResult.error.message);
    }
    if (memberResult.error) {
      setLoadError(memberResult.error.message);
      setMembers([]);
      setInvites(inviteResult.data ?? []);
      return;
    }

    const membershipRows = memberResult.data ?? [];
    const userIds = membershipRows.map((m: any) => m.user_id);

    let profileMap = new Map<string, { email: string; fullName: string }>();
    if (userIds.length) {
      const profileResult = await supabase
        .from("profiles")
        .select("id,email,full_name")
        .in("id", userIds);

      if (profileResult.error) {
        setLoadError(profileResult.error.message);
      } else {
        profileMap = new Map(
          (profileResult.data ?? []).map((profile: any) => [
            profile.id,
            {
              email: profile.email ?? "",
              fullName: profile.full_name ?? "",
            },
          ])
        );
      }
    }

    setInvites(inviteResult.data ?? []);
    setMembers(
      membershipRows.map((membership: any) => {
        const profile = profileMap.get(membership.user_id);
        return {
          ...membership,
          email: profile?.email ?? "",
          fullName: profile?.fullName ?? "",
        };
      })
    );
  }

  useEffect(() => {
    if (company) refresh();
  }, [company]);

  async function getAccessToken() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function invite(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    const accessToken = await getAccessToken();

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

  async function manageInvitation(action: "remind" | "delete" | "remind_all", invitationId?: string) {
    if (action === "delete") {
      const invite = invites.find((item) => item.id === invitationId);
      if (!window.confirm(`Delete the pending invitation for ${invite?.email ?? "this employee"}?`)) return;
    }

    setMessage("");
    setInviteAction(action === "remind_all" ? "all" : `${action}:${invitationId}`);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setMessage("Your session expired. Please sign in again.");
      setInviteAction(null);
      return;
    }

    const response = await fetch("/api/invitations/manage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action, invitationId }),
    });

    const result = await response.json();
    setMessage(response.ok ? result.message : result.error || "Invitation action failed.");

    if (response.ok) await refresh();
    setInviteAction(null);
  }

  async function manageEmployee(action: "remove" | "delete_data", member: any) {
    const label = member.fullName || member.email || "this employee";
    const prompt =
      action === "delete_data"
        ? `Permanently remove ${label} from this company and delete this employee's company training assignments and completion history?`
        : `Remove ${label} from this company? Their company training history will be left in place.`;

    if (!window.confirm(prompt)) return;

    setMessage("");
    setEmployeeAction(`${action}:${member.user_id}`);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setMessage("Your session expired. Please sign in again.");
      setEmployeeAction(null);
      return;
    }

    const response = await fetch("/api/employees/manage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action, userId: member.user_id }),
    });

    const result = await response.json();
    setMessage(response.ok ? result.message : result.error || "Employee action failed.");

    if (response.ok) await refresh();
    setEmployeeAction(null);
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
          <div className="border-b border-white/10 px-5 py-4">
            <div className="font-semibold">Active Company Users ({members.length})</div>
            <div className="mt-0.5 text-xs text-slate-500">Accepted users appear here with their name, email, role, and management options.</div>
          </div>

          {loadError ? (
            <div className="border-b border-red-400/20 bg-red-400/5 px-5 py-3 text-sm text-red-300">
              {loadError}
            </div>
          ) : null}

          {members.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">No active users yet.</div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="border-b border-white/10 px-5 py-4 last:border-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-200">
                      {member.fullName || member.email || "Active user"}
                    </div>
                    {member.email ? (
                      <div className="mt-1 truncate text-sm text-slate-400">{member.email}</div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-500">Profile email unavailable</div>
                    )}
                    <div className="mt-1 text-xs capitalize text-slate-500">{member.role}</div>
                  </div>

                  {member.role === "employee" ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => manageEmployee("remove", member)}
                        disabled={employeeAction !== null}
                        className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50"
                      >
                        {employeeAction === `remove:${member.user_id}` ? "Removing..." : "Remove"}
                      </button>
                      <button
                        type="button"
                        onClick={() => manageEmployee("delete_data", member)}
                        disabled={employeeAction !== null}
                        className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/15 disabled:opacity-50"
                      >
                        {employeeAction === `delete_data:${member.user_id}` ? "Deleting..." : "Delete + Training Data"}
                      </button>
                    </div>
                  ) : (
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-slate-400">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="font-semibold">Pending Invitations ({invites.length})</div>
              <div className="mt-0.5 text-xs text-slate-500">Only invitations awaiting acceptance are shown.</div>
            </div>
            {invites.length > 0 ? (
              <button
                type="button"
                onClick={() => manageInvitation("remind_all")}
                disabled={inviteAction !== null}
                className="shrink-0 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/15 disabled:opacity-50"
              >
                {inviteAction === "all" ? "Sending..." : "Remind All"}
              </button>
            ) : null}
          </div>

          {invites.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">No pending invitations.</div>
          ) : (
            invites.map((x) => (
              <div
                key={x.id}
                className="border-b border-white/10 px-5 py-4 text-sm last:border-0"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-200">{x.email}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Invited {new Date(x.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => manageInvitation("remind", x.id)}
                      disabled={inviteAction !== null}
                      className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/15 disabled:opacity-50"
                    >
                      {inviteAction === `remind:${x.id}` ? "Sending..." : "Remind"}
                    </button>
                    <button
                      type="button"
                      onClick={() => manageInvitation("delete", x.id)}
                      disabled={inviteAction !== null}
                      className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/15 disabled:opacity-50"
                    >
                      {inviteAction === `delete:${x.id}` ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
