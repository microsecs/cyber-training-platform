import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return NextResponse.json({ error: "STRIPE_PRICE_ID is not configured" }, { status: 500 });

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { data: membership, error: membershipError } = await userClient
      .from("memberships")
      .select("company_id,role,companies(name,stripe_customer_id,stripe_subscription_id,subscription_status)")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();

    if (membershipError || !membership) return NextResponse.json({ error: "Company administrator access required" }, { status: 403 });
    const company: any = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;

    if (company?.stripe_subscription_id && ["active","trialing","past_due","unpaid"].includes(company?.subscription_status)) {
      return NextResponse.json({ error: "This company already has a subscription." }, { status: 409 });
    }

    const admin = createAdminClient();
    const stripe = getStripe();
    let customerId = company?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email || undefined,
        name: company?.name || undefined,
        metadata: { company_id: membership.company_id, owner_user_id: userData.user.id },
      });
      customerId = customer.id;
      const { error: updateError } = await admin.from("companies").update({ stripe_customer_id: customerId, subscription_updated_at: new Date().toISOString() }).eq("id", membership.company_id);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/subscribe?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe?canceled=1`,
      client_reference_id: membership.company_id,
      metadata: { company_id: membership.company_id, user_id: userData.user.id },
      subscription_data: { metadata: { company_id: membership.company_id, owner_user_id: userData.user.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not start Stripe Checkout" }, { status: 500 });
  }
}
