import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

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

    const secretKey = normalizeSecret(
      process.env.EASYDESKTOP_STRIPE_LIVE_SECRET_KEY
    );

    if (!secretKey) {
      return NextResponse.json(
        { error: "EasyDesktop live Stripe secret key is not configured." },
        { status: 500 }
      );
    }

    if (!(secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_"))) {
      const detected = keyType(secretKey);
      const hint =
        detected === "pk_live"
          ? "A Stripe publishable key was entered. Use the live Secret key instead."
          : detected.includes("test")
          ? "A Stripe test/sandbox key is configured. Use a live Secret key instead."
          : detected === "missing"
          ? "The Vercel Production environment variable is missing or was not loaded by this deployment."
          : "The configured value is not a recognized Stripe live Secret key.";

      return NextResponse.json(
        {
          error: "EasyDesktop checkout is not configured with a live Stripe key.",
          detected_key_type: detected,
          hint,
        },
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
