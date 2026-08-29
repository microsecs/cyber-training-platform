"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";
import { companyHasSubscriptionAccess, SUBSCRIPTION_GRACE_PERIOD_DAYS } from "@/lib/subscription";

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BillingPage() {
  const { company, loading, error } = useCompany();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function openPortal() {
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/stripe/create-portal-session", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not open billing portal");
      window.location.href = result.url;
    } catch (e: any) { setMessage(e?.message || "Could not open billing portal"); setBusy(false); }
  }

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-12">Loading billing...</main>;
  if (!company) return <main className="mx-auto max-w-5xl px-6 py-12">{error || "Company not found."}</main>;

  const subscription = { status: company.subscriptionStatus, paymentFailedAt: company.subscriptionPaymentFailedAt, billingExempt: company.billingExempt };
  const hasAccess = companyHasSubscriptionAccess(subscription);
  const pastDue = company.subscriptionStatus === "past_due";

  return <main className="mx-auto max-w-5xl px-6 py-12">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="text-sm text-cyan-300">{company.companyName}</div><h1 className="mt-1 text-4xl font-bold">Billing & Subscription</h1><p className="mt-2 text-slate-400">Manage your MicroSECONDS company subscription securely through Stripe.</p></div>
      <Link href="/admin" className="rounded-lg border border-white/15 px-4 py-3 font-semibold hover:bg-white/5">Back to Dashboard</Link>
    </div>

    {pastDue && <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100"><div className="font-semibold">Payment needs attention</div><p className="mt-1 text-sm">Your subscription is past due. Company administration remains available during the {SUBSCRIPTION_GRACE_PERIOD_DAYS}-day grace period. Use Manage Billing to update your payment method.</p></div>}
    {!hasAccess && !company.billingExempt && <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-100"><div className="font-semibold">Subscription access is inactive</div><p className="mt-1 text-sm">Update or reactivate billing to restore company administration. Your employees, assignments, reports, and completion history have not been deleted.</p></div>}

    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6"><div className="text-sm text-slate-400">Subscription status</div><div className="mt-2 text-2xl font-bold capitalize">{company.billingExempt ? "Billing exempt" : company.subscriptionStatus || "none"}</div><div className="mt-4 text-sm text-slate-300">{company.subscriptionCancelAtPeriodEnd ? "Cancellation scheduled" : "Automatic renewal enabled"}</div></div>
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6"><div className="text-sm text-slate-400">Current period ends</div><div className="mt-2 text-xl font-semibold">{formatDate(company.subscriptionCurrentPeriodEnd)}</div><p className="mt-4 text-sm text-slate-400">If cancellation is scheduled, access continues through the paid subscription period.</p></div>
    </div>

    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Manage your subscription</h2><p className="mt-2 text-sm text-slate-400">Stripe's secure Customer Portal lets you update your payment method, view invoices, and cancel your subscription.</p>
      {company.stripeCustomerId ? <button onClick={openPortal} disabled={busy || !["owner","admin"].includes(company.role)} className="mt-5 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Opening Stripe..." : "Manage Billing"}</button> : <Link href="/subscribe" className="mt-5 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Start Subscription</Link>}
      {message && <div className="mt-4 text-sm text-rose-300">{message}</div>}
    </div>
  </main>;
}
