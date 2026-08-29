"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

export default function SubscribePage() {
  const { company, loading, error } = useCompany();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function startCheckout() {
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Please sign in first.");
      const response = await fetch("/api/stripe/create-checkout-session", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start checkout");
      window.location.href = result.url;
    } catch (e: any) { setMessage(e?.message || "Could not start checkout"); setBusy(false); }
  }

  if (loading) return <main className="mx-auto max-w-4xl px-6 py-16">Loading subscription...</main>;
  if (!company) return <main className="mx-auto max-w-4xl px-6 py-16">{error || "Please sign in to subscribe."}</main>;

  const active = company.subscriptionStatus === "active" || company.subscriptionStatus === "trialing";
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
        <div className="text-sm text-cyan-300">{company.companyName}</div>
        <h1 className="mt-2 text-3xl font-bold">MicroSECONDS Subscription</h1>
        <p className="mt-3 text-slate-400">One subscription gives your company access to the MicroSECONDS employee cybersecurity training platform.</p>
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-950 p-6">
          <div className="text-lg font-semibold">Company Training Subscription</div>
          <div className="mt-3 text-slate-300">Unlimited employees • Training courses • Quizzes • Completion tracking • Reports</div>
          <div className="mt-4 text-sm text-slate-400">Have a coupon or free-subscription code? You can enter it securely during Stripe Checkout.</div>
          <div className="mt-6 text-sm">Current status: <span className="font-semibold capitalize">{company.subscriptionStatus || "none"}</span></div>
          {active ? (
            <div className="mt-6 rounded-lg bg-emerald-400/10 p-4 text-emerald-200">Your company subscription is already active.</div>
          ) : (
            <button onClick={startCheckout} disabled={busy || !["owner","admin"].includes(company.role)} className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
              {busy ? "Opening Secure Checkout..." : "Subscribe with Stripe"}
            </button>
          )}
          {message && <div className="mt-4 text-sm text-rose-300">{message}</div>}
        </div>
        <p className="mt-5 text-xs text-slate-500">Payments and promotion codes are handled by Stripe Checkout. This release does not yet activate access from Checkout; webhook synchronization is the next update.</p>
      </div>
    </main>
  );
}
