import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function idFromExpandable(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in (value as Record<string, unknown>)) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function unixToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function currentPeriodEnd(subscription: any): string | null {
  if (typeof subscription?.current_period_end === "number") {
    return unixToIso(subscription.current_period_end);
  }

  const itemEnds = Array.isArray(subscription?.items?.data)
    ? subscription.items.data
        .map((item: any) => item?.current_period_end)
        .filter((value: unknown) => typeof value === "number")
    : [];

  if (!itemEnds.length) return null;
  return unixToIso(Math.max(...itemEnds));
}

function priceId(subscription: any): string | null {
  const firstItem = subscription?.items?.data?.[0];
  return firstItem?.price?.id || firstItem?.plan?.id || null;
}

function hasDiscount(subscription: any): boolean {
  if (subscription?.discount) return true;
  if (Array.isArray(subscription?.discounts) && subscription.discounts.length > 0) return true;
  if (Array.isArray(subscription?.items?.data)) {
    return subscription.items.data.some(
      (item: any) =>
        item?.discount ||
        (Array.isArray(item?.discounts) && item.discounts.length > 0)
    );
  }
  return false;
}

async function findCompanyId(subscription: any): Promise<string | null> {
  const metadataCompanyId = subscription?.metadata?.company_id;
  if (typeof metadataCompanyId === "string" && metadataCompanyId) return metadataCompanyId;

  const admin = createAdminClient();
  const subscriptionId = typeof subscription?.id === "string" ? subscription.id : null;
  const customerId = idFromExpandable(subscription?.customer);

  if (subscriptionId) {
    const { data } = await admin
      .from("companies")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (customerId) {
    const { data } = await admin
      .from("companies")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  options?: { paymentFailed?: boolean; paymentFailedAt?: string | null }
) {
  const sub: any = subscription;
  const companyId = await findCompanyId(sub);
  if (!companyId) return { updated: false, reason: "company_not_found" } as const;

  const admin = createAdminClient();
  const status = String(sub.status || "none");
  const customerId = idFromExpandable(sub.customer);
  const isProblemStatus = status === "past_due" || status === "unpaid";
  const paymentFailed = options?.paymentFailed ?? isProblemStatus;

  let paymentFailedAt: string | null = null;
  if (paymentFailed) {
    if (options && "paymentFailedAt" in options) {
      paymentFailedAt = options.paymentFailedAt ?? new Date().toISOString();
    } else {
      const { data: existing } = await admin
        .from("companies")
        .select("subscription_payment_failed_at")
        .eq("id", companyId)
        .maybeSingle();
      paymentFailedAt = existing?.subscription_payment_failed_at || new Date().toISOString();
    }
  }

  const { error } = await admin
    .from("companies")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId(sub),
      subscription_status: status,
      subscription_current_period_end: currentPeriodEnd(sub),
      subscription_cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      subscription_payment_failed: paymentFailed,
      subscription_payment_failed_at: paymentFailed ? paymentFailedAt : null,
      subscription_discount_active: hasDiscount(sub),
      subscription_updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (error) throw new Error(`Could not update company subscription: ${error.message}`);
  return { updated: true, companyId } as const;
}

export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const inv: any = invoice;
  return (
    idFromExpandable(inv.subscription) ||
    idFromExpandable(inv.parent?.subscription_details?.subscription) ||
    idFromExpandable(inv.subscription_details?.subscription) ||
    null
  );
}
