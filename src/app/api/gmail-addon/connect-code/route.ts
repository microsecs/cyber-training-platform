import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let result = "";
  for (let i = 0; i < 8; i++) result += alphabet[bytes[i] % alphabet.length];
  return result;
}

async function accessForUser(userId: string) {
  const admin = createAdminClient();

  const { data: platformAdmin } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (platformAdmin) {
    return { role: "platform_admin", companyId: null as string | null };
  }

  const { data: membership } = await admin
    .from("memberships")
    .select("role,is_active,company_id,companies(subscription_status,billing_exempt)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const company: any = Array.isArray((membership as any).companies)
    ? (membership as any).companies[0]
    : (membership as any).companies;

  const active =
    company?.billing_exempt === true ||
    company?.subscription_status === "active" ||
    company?.subscription_status === "trialing";

  if (!active) return null;

  return {
    role: String((membership as any).role || "employee"),
    companyId: String((membership as any).company_id || ""),
  };
}

export async function POST(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const authClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await authClient.auth.getUser(bearer);
  if (!data.user) return NextResponse.json({ error: "Your session has expired." }, { status: 401 });

  const access = await accessForUser(data.user.id);
  if (!access) {
    return NextResponse.json(
      { error: "Gmail integration requires an active MicroSECONDS subscription." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  await admin
    .from("gmail_addon_pair_codes")
    .delete()
    .eq("user_id", data.user.id)
    .is("used_at", null);

  const code = makeCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await admin.from("gmail_addon_pair_codes").insert({
    code_hash: hash(code),
    user_id: data.user.id,
    company_id: access.companyId || null,
    role: access.role,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Gmail pairing code insert error", error);
    return NextResponse.json({ error: "Could not create a connection code." }, { status: 500 });
  }

  return NextResponse.json({ code, expires_at: expiresAt });
}
