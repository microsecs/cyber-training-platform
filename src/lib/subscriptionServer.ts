import { createAdminClient } from "@/lib/supabase/admin";
import { companyHasSubscriptionAccess } from "@/lib/subscription";

export async function getUserCompanySubscriptionAccess(userId: string) {
  const admin = createAdminClient();
  const { data: membership, error } = await admin
    .from("memberships")
    .select("company_id,role,is_active,companies(subscription_status,subscription_payment_failed_at,billing_exempt)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !membership) {
    return { allowed: false, role: null, companyId: null, reason: "no_active_company" };
  }

  const company: any = Array.isArray(membership.companies)
    ? membership.companies[0]
    : membership.companies;

  const allowed = companyHasSubscriptionAccess({
    status: company?.subscription_status ?? "none",
    paymentFailedAt: company?.subscription_payment_failed_at ?? null,
    billingExempt: company?.billing_exempt ?? false,
  });

  return {
    allowed,
    role: membership.role as string,
    companyId: membership.company_id as string,
    reason: company?.subscription_status ?? "none",
  };
}
