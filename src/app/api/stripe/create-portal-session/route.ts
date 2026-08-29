import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { data: membership } = await userClient
      .from("memberships")
      .select("company_id,role,companies(stripe_customer_id)")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();
    if (!membership) return NextResponse.json({ error: "Company administrator access required" }, { status: 403 });

    const company: any = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;
    if (!company?.stripe_customer_id) return NextResponse.json({ error: "No Stripe customer is connected to this company." }, { status: 400 });

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not open billing portal" }, { status: 500 });
  }
}
