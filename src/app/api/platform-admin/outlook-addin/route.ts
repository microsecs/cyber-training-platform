"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "platform-files";
const PATH = "outlook/microseconds-email-analyzer-outlook.xml";

async function requirePlatformAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const authClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await authClient.auth.getUser(token);
  if (!data.user) return null;
  const admin = createAdminClient();
  const { data: row } = await admin.from("platform_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return row ? data.user : null;
}

async function ensureBucket() {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  if (!(buckets || []).some((b) => b.name === BUCKET)) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: false });
    if (error && !String(error.message).toLowerCase().includes("already")) throw error;
  }
}

export async function GET(request: NextRequest) {
  const user = await requirePlatformAdmin(request);
  if (!user) return NextResponse.json({ error: "Platform Admin required." }, { status: 403 });
  await ensureBucket();
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).list("outlook", { search: "microseconds-email-analyzer-outlook.xml" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const file = data?.find((f) => f.name === "microseconds-email-analyzer-outlook.xml");
  return NextResponse.json({ uploaded: Boolean(file), updatedAt: file?.updated_at || file?.created_at || null });
}

export async function POST(request: NextRequest) {
  const user = await requirePlatformAdmin(request);
  if (!user) return NextResponse.json({ error: "Platform Admin required." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an XML manifest file." }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xml")) return NextResponse.json({ error: "The Outlook add-in file must be an .xml manifest." }, { status: 400 });
  if (file.size > 1024 * 1024) return NextResponse.json({ error: "Manifest file is too large." }, { status: 400 });
  const text = await file.text();
  if (!text.includes("<OfficeApp") || !text.includes("MicroSECONDS")) {
    return NextResponse.json({ error: "This does not appear to be a MicroSECONDS Outlook add-in manifest." }, { status: 400 });
  }
  await ensureBucket();
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).upload(PATH, new Blob([text], { type: "application/xml" }), {
    upsert: true, contentType: "application/xml",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
