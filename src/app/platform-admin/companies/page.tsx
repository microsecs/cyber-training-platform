"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CompanyRow = {
  id: string;
  name: string;
  created_at?: string | null;
  status_key: "active" | "past_due" | "inactive";
  status_label: string;
  subscription_status?: string | null;
  billing_exempt: boolean;
  subscription_current_period_end?: string | null;
  subscription_cancel_at_period_end: boolean;
  stripe_customer_id?: string | null;
  invited_employees: number;
  pending_invitations: number;
  accepted_invitations: number;
  active_employees: number;
  employee_memberships: number;
  owners_admins: number;
};

function dateText(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "past_due" | "inactive">("all");
  const [deleteCompany, setDeleteCompany] = useState<CompanyRow | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function token() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function loadCompanies() {
    setLoading(true);
    setError("");

    try {
      const accessToken = await token();
      if (!accessToken) throw new Error("Please sign in.");

      const response = await fetch("/api/platform-admin/companies", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load companies.");

      setCompanies(result.companies || []);
    } catch (e: any) {
      setError(e?.message || "Could not load companies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesSearch =
        !q ||
        company.name.toLowerCase().includes(q) ||
        company.id.toLowerCase().includes(q);

      const matchesFilter = filter === "all" || company.status_key === filter;
      return matchesSearch && matchesFilter;
    });
  }, [companies, search, filter]);

  const summary = useMemo(() => {
    return {
      total: companies.length,
      active: companies.filter((c) => c.status_key === "active").length,
      pastDue: companies.filter((c) => c.status_key === "past_due").length,
      inactive: companies.filter((c) => c.status_key === "inactive").length,
      employees: companies.reduce((total, c) => total + c.active_employees, 0),
      pending: companies.reduce((total, c) => total + c.pending_invitations, 0),
    };
  }, [companies]);

  async function confirmDelete() {
    if (!deleteCompany) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const accessToken = await token();
      if (!accessToken) throw new Error("Please sign in.");

      const response = await fetch("/api/platform-admin/companies", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          companyId: deleteCompany.id,
          confirmation: confirmName,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete company.");

      setMessage(result.message || "Company deleted.");
      setDeleteCompany(null);
      setConfirmName("");
      await loadCompanies();
    } catch (e: any) {
      setError(e?.message || "Could not delete company.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">MicroSECONDS Platform</div>
          <h1 className="mt-1 text-4xl font-bold">Customer Companies</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Review company subscription status, invitations, active employees, and company accounts.
          </p>
        </div>

        <Link
          href="/platform-admin"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
        >
          Back to Platform Admin
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          ["Companies", summary.total],
          ["Active", summary.active],
          ["Past Due", summary.pastDue],
          ["Inactive", summary.inactive],
          ["Active Employees", summary.employees],
          ["Pending Invites", summary.pending],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-white/10 bg-slate-900 p-5">
            <div className="text-2xl font-bold text-cyan-300">{value}</div>
            <div className="mt-1 text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 outline-none focus:border-cyan-400/40 sm:max-w-sm"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadCompanies}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-slate-400">Loading companies...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-slate-400">No companies match this view.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((company) => (
              <div key={company.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(240px,1.5fr)_130px_120px_120px_120px_110px_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold text-white">
                      {company.name}
                    </div>
                    <div className="mt-1 truncate font-mono text-[11px] text-slate-600">
                      {company.id}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Created {dateText(company.created_at)}
                      {company.subscription_cancel_at_period_end
                        ? " · Cancellation scheduled"
                        : ""}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Status</div>
                    <div
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        company.status_key === "active"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : company.status_key === "past_due"
                          ? "bg-amber-400/10 text-amber-300"
                          : "bg-red-400/10 text-red-300"
                      }`}
                    >
                      {company.status_label}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Invited</div>
                    <div className="mt-1 text-xl font-bold">{company.invited_employees}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Pending</div>
                    <div className="mt-1 text-xl font-bold text-amber-300">
                      {company.pending_invitations}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Active Employees</div>
                    <div className="mt-1 text-xl font-bold text-emerald-300">
                      {company.active_employees}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Admins</div>
                    <div className="mt-1 text-xl font-bold">{company.owners_admins}</div>
                  </div>

                  <div className="xl:text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteCompany(company);
                        setConfirmName("");
                        setError("");
                      }}
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {company.subscription_current_period_end ? (
                  <div className="mt-3 text-xs text-slate-600">
                    Subscription period ends {dateText(company.subscription_current_period_end)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {deleteCompany ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-red-400/30 bg-slate-900 p-6 shadow-2xl">
            <div className="text-sm font-semibold uppercase tracking-wide text-red-300">
              Delete Company
            </div>
            <h2 className="mt-2 text-2xl font-bold">{deleteCompany.name}</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              This permanently removes the company and its company-scoped invitations,
              memberships, assignments, analyzer records, and other company data.
              Login accounts that no longer belong to any company are also removed so the
              same email address can be used for a clean future signup.
            </p>

            <p className="mt-5 text-sm text-slate-300">
              Type <span className="font-semibold text-white">{deleteCompany.name}</span> to confirm.
            </p>

            <input
              autoFocus
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-red-400/50"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteCompany(null);
                  setConfirmName("");
                }}
                disabled={deleting}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting || confirmName !== deleteCompany.name}
                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Permanently Delete Company"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
