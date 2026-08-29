"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useCompany() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setError("Not signed in");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("memberships")
        .select(
          "company_id, role, companies(name,stripe_customer_id,stripe_subscription_id,stripe_price_id,subscription_status,subscription_current_period_end,subscription_cancel_at_period_end,subscription_payment_failed,subscription_payment_failed_at,subscription_updated_at,billing_exempt)"
        )
        .eq("user_id", authData.user.id)
        .limit(1)
        .single();

      if (error || !data) {
        setError(error?.message || "No company membership found");
        setLoading(false);
        return;
      }

      const c: any = Array.isArray(data.companies)
        ? data.companies[0]
        : data.companies;

      setCompany({
        companyId: data.company_id,
        companyName: c?.name ?? "Company",
        role: data.role,
        userId: authData.user.id,
        email: authData.user.email ?? "",
        stripeCustomerId: c?.stripe_customer_id ?? null,
        stripeSubscriptionId: c?.stripe_subscription_id ?? null,
        stripePriceId: c?.stripe_price_id ?? null,
        subscriptionStatus: c?.subscription_status ?? "none",
        subscriptionCurrentPeriodEnd: c?.subscription_current_period_end ?? null,
        subscriptionCancelAtPeriodEnd: c?.subscription_cancel_at_period_end ?? false,
        subscriptionPaymentFailed: c?.subscription_payment_failed ?? false,
        subscriptionPaymentFailedAt: c?.subscription_payment_failed_at ?? null,
        subscriptionUpdatedAt: c?.subscription_updated_at ?? null,
        billingExempt: c?.billing_exempt ?? false,
      });

      setLoading(false);
    })();
  }, []);

  return { company, loading, error };
}
