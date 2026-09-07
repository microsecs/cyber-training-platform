import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { recordEasyDesktopPurchase } from "@/lib/easydesktopPurchase";

export const runtime = "nodejs";

function normalizeSecret(value: string | undefined) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function keyType(value: string) {
  if (!value) return "missing";
  if (value.startsWith("sk_live_")) return "sk_live";
  if (value.startsWith("rk_live_")) return "rk_live";
  if (value.startsWith("pk_live_")) return "pk_live";
  if (value.startsWith("sk_test_")) return "sk_test";
  if (value.startsWith("rk_test_")) return "rk_test";
  if (value.startsWith("pk_test_")) return "pk_test";
  return "unrecognized";
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secretKey = normalizeSecret(
    process.env.EASYDESKTOP_STRIPE_LIVE_SECRET_KEY
  );
  const webhookSecret = String(
    process.env.EASYDESKTOP_STRIPE_LIVE_WEBHOOK_SECRET || ""
  ).trim();

  if (!secretKey || !(secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_"))) {
    return NextResponse.json(
      {
        error: "EasyDesktop live Stripe secret key is not configured.",
        detected_key_type: keyType(secretKey),
      },
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "EasyDesktop live Stripe webhook secret is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error?.message || "Invalid signature"}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        session.mode === "payment" &&
        session.metadata?.product_key === "easydesktop10"
      ) {
        await recordEasyDesktopPurchase(session);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("EasyDesktop live Stripe webhook error", {
      eventId: event.id,
      eventType: event.type,
      error: error?.message || String(error),
    });

    return NextResponse.json(
      { error: error?.message || "EasyDesktop webhook processing failed." },
      { status: 500 }
    );
  }
}
