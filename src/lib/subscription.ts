export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | string;

export type CompanySubscription = {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  status?: SubscriptionStatus | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  paymentFailed?: boolean | null;
  paymentFailedAt?: string | null;
  billingExempt?: boolean | null;
};

export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 7;

export function isSubscriptionFullyActive(status?: SubscriptionStatus | null) {
  return status === "active" || status === "trialing";
}

export function isSubscriptionPaymentProblem(status?: SubscriptionStatus | null) {
  return status === "past_due" || status === "unpaid";
}

export function isSubscriptionTerminal(status?: SubscriptionStatus | null) {
  return (
    status === "canceled" ||
    status === "unpaid" ||
    status === "incomplete_expired" ||
    status === "paused"
  );
}

export function isWithinPastDueGracePeriod(
  paymentFailedAt?: string | null,
  graceDays = SUBSCRIPTION_GRACE_PERIOD_DAYS
) {
  if (!paymentFailedAt) return false;

  const failedAt = new Date(paymentFailedAt).getTime();
  if (!Number.isFinite(failedAt)) return false;

  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  return Date.now() - failedAt <= graceMs;
}

export function companyHasSubscriptionAccess(subscription: CompanySubscription) {
  if (subscription.billingExempt) return true;

  const status = subscription.status ?? "none";

  if (isSubscriptionFullyActive(status)) return true;

  if (status === "past_due") {
    return isWithinPastDueGracePeriod(subscription.paymentFailedAt);
  }

  return false;
}

export function subscriptionAccessReason(subscription: CompanySubscription) {
  if (subscription.billingExempt) return "billing_exempt";
  const status = subscription.status ?? "none";
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" && isWithinPastDueGracePeriod(subscription.paymentFailedAt)) return "grace_period";
  if (status === "past_due") return "grace_expired";
  return status;
}
