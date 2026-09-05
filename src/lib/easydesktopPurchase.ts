import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function recordEasyDesktopPurchase(session: Stripe.Checkout.Session) {
  if (
    session.mode !== "payment" ||
    session.metadata?.product_key !== "easydesktop10"
  ) {
    return;
  }

  const admin = createAdminClient();
  const paid = session.payment_status === "paid";

  const { error } = await admin.from("software_orders").upsert(
    {
      product_key: "easydesktop10",
      customer_email:
        session.customer_details?.email ||
        session.customer_email ||
        null,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: idOf(session.payment_intent as any),
      stripe_customer_id: idOf(session.customer as any),
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      payment_status: session.payment_status || "unpaid",
      purchased_at: paid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_checkout_session_id" }
  );

  if (error) throw error;
}
