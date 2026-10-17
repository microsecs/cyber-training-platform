import { Resend } from "resend";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export async function sendSubscriptionEmail(subscription: Stripe.Subscription, kind: "activated" | "canceled", eventId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL are required for subscription emails");
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const customer = await getStripe().customers.retrieve(customerId);
  if (customer.deleted || !customer.email) throw new Error(`No email address for Stripe customer ${customerId}`);
  const price = subscription.items.data[0]?.price;
  const regularPrice = price?.unit_amount == null ? "See billing portal" : new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency }).format(price.unit_amount / 100);
  const interval = price?.recurring?.interval || "month";
  const subject = kind === "activated" ? "Your MicroSECONDS Training subscription is active" : "Your MicroSECONDS Training subscription has ended";
  const description = kind === "activated"
    ? `Your subscription is active. Regular plan price: ${regularPrice} per ${interval}. Any discounts and actual charges are shown in your billing portal. This confirmation also applies to fully discounted subscriptions.`
    : "Your subscription has ended. You can review your account and subscription options in the portal.";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://cyber-training-platform-seven.vercel.app").replace(/\/$/, "");
  const { error } = await new Resend(apiKey).emails.send({
    from, to: customer.email, subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px;color:#172033"><div style="font-weight:bold;color:#033166">MicroSECONDS Training</div><h1>${subject}</h1><p>${description}</p><p><a href="${base}/account" style="background:#033166;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;display:inline-block">View account</a></p><p style="color:#64748b;font-size:13px">Invoices and receipts, where applicable, are available in your billing portal.</p></div>`,
  }, { idempotencyKey: `training-subscription-${kind}-${eventId}` });
  if (error) throw new Error(`Resend email error: ${error.message}`);
}
