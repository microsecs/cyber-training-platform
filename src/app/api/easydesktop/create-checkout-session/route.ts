import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { data: settings, error } = await admin
      .from("easydesktop_settings")
      .select("stripe_price_id")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Production EasyDesktop checkout uses its own live Price ID.
    // The environment variable deliberately takes precedence over the older
    // database setting so a stale sandbox Price ID cannot override production.
    const priceId =
      String(process.env.EASYDESKTOP_STRIPE_LIVE_PRICE_ID || "").trim() ||
      String(settings?.stripe_price_id || "").trim();

    if (!priceId) {
      return NextResponse.json(
        { error: "EasyDesktop Stripe Price ID is not configured." },
        { status: 500 }
      );
    }

    const secretKey = String(
      process.env.EASYDESKTOP_STRIPE_LIVE_SECRET_KEY || ""
    ).trim();

    if (!secretKey) {
      return NextResponse.json(
        { error: "EasyDesktop live Stripe secret key is not configured." },
        { status: 500 }
      );
    }

    if (!secretKey.startsWith("sk_live_")) {
      return NextResponse.json(
        { error: "EasyDesktop checkout is not configured with a live Stripe key." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);
    const origin = request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
      metadata: {
        purchase_type: "software",
        product_key: "easydesktop10",
      },
      payment_intent_data: {
        metadata: {
          purchase_type: "software",
          product_key: "easydesktop10",
        },
      },
      success_url: `${origin}/easydesktop/purchase-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/easydesktop`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not start EasyDesktop checkout." },
      { status: 500 }
    );
  }
}
