import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = String(body?.code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (code.length !== 8) {
    return NextResponse.json({ error: "Enter the 8-character connection code." }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: row } = await admin
    .from("gmail_addon_pair_codes")
    .select("id,user_id,company_id,role,expires_at,used_at")
    .eq("code_hash", hash(code))
    .maybeSingle();

  if (!row || row.used_at || new Date(row.expires_at) <= now) {
    return NextResponse.json(
      { error: "That connection code is invalid or has expired." },
      { status: 400 }
    );
  }

  // Re-check company status before issuing a long-lived add-on token.
  if (row.role !== "platform_admin" && row.company_id) {
    const { data: company } = await admin
      .from("companies")
      .select("subscription_status,billing_exempt")
      .eq("id", row.company_id)
      .maybeSingle();

    const active =
      (company as any)?.billing_exempt === true ||
      (company as any)?.subscription_status === "active" ||
      (company as any)?.subscription_status === "trialing";

    if (!active) {
      return NextResponse.json({ error: "This MicroSECONDS subscription is not active." }, { status: 403 });
    }
  }

  const token = randomBytes(32).toString("base64url");
  const { error: insertError } = await admin.from("gmail_addon_connections").insert({
    token_hash: hash(token),
    user_id: row.user_id,
    company_id: row.company_id,
    role: row.role,
    label: "Gmail Add-on",
  });

  if (insertError) {
    console.error("Gmail connection insert error", insertError);
    return NextResponse.json({ error: "Could not connect Gmail." }, { status: 500 });
  }

  await admin
    .from("gmail_addon_pair_codes")
    .update({ used_at: now.toISOString() })
    .eq("id", row.id);

  return NextResponse.json({ token });
}
