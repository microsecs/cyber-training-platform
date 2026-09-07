import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { recordEasyDesktopPurchase } from "@/lib/easydesktopPurchase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secretKey = String(
    process.env.EASYDESKTOP_STRIPE_LIVE_SECRET_KEY || ""
  ).trim();
  const webhookSecret = String(
    process.env.EASYDESKTOP_STRIPE_LIVE_WEBHOOK_SECRET || ""
  ).trim();

  if (!secretKey || !secretKey.startsWith("sk_live_")) {
    return NextResponse.json(
      { error: "EasyDesktop live Stripe secret key is not configured." },
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
