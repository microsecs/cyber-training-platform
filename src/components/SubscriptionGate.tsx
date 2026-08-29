"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { useCompany } from "@/lib/supabase/useCompany";
import { companyHasSubscriptionAccess, SUBSCRIPTION_GRACE_PERIOD_DAYS } from "@/lib/subscription";

export default function SubscriptionGate({ children }: { children: ReactNode }) {
  const { company, loading } = useCompany();
  if (loading) return <main className="mx-auto max-w-5xl px-6 py-12">Checking subscription...</main>;
  if (!company) return <>{children}</>;
  const access = companyHasSubscriptionAccess({ status: company.subscriptionStatus, paymentFailedAt: company.subscriptionPaymentFailedAt, billingExempt: company.billingExempt });
  if (access) return <>{children}</>;
  return <main className="mx-auto max-w-4xl px-6 py-16"><div className="rounded-2xl border border-rose-400/30 bg-slate-900 p-8"><h1 className="text-3xl font-bold">Subscription required</h1><p className="mt-3 text-slate-300">Company administration is currently unavailable because the MicroSECONDS subscription is inactive or the {SUBSCRIPTION_GRACE_PERIOD_DAYS}-day payment grace period has ended. No company data has been deleted.</p><Link href="/account#billing" className="mt-6 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Manage Billing</Link></div></main>;
}
