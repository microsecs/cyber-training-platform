import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-microseconds-gmail-token");
  if (!token) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error } = await admin
    .from("gmail_addon_connections")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);

  if (error) {
    console.error("Gmail disconnect error", error);
    return NextResponse.json({ error: "Could not disconnect Gmail." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
