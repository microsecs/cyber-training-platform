import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseEmail } from "outlook-email-parser";

export const runtime = "nodejs";

async function authorize(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  if (!token) return { ok: false as const, status: 401, error: "Please sign in." };

  const admin = createAdminClient();

  const { data: userData, error: userError } =
    await admin.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      ok: false as const,
      status: 401,
      error: "Your session could not be verified. Please sign out and sign back in.",
    };
  }
  const { data: platformAdmin } = await admin.from("platform_admins").select("user_id").eq("user_id", userData.user.id).maybeSingle();
  if (platformAdmin) return { ok: true as const };

  const { data: membership } = await admin
    .from("memberships")
    .select("is_active,companies(subscription_status,billing_exempt)")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const company: any = Array.isArray((membership as any)?.companies)
    ? (membership as any).companies[0]
    : (membership as any)?.companies;

  const active = company?.billing_exempt === true || company?.subscription_status === "active" || company?.subscription_status === "trialing";
  if (!membership || !active) return { ok: false as const, status: 403, error: "Email Risk Analyzer requires an active MicroSECONDS subscription." };
  return { ok: true as const };
}

function str(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(", ");
  if (v.address) return `${v.name || ""} <${v.address}>`.trim();
  if (v.text) return String(v.text);
  if (v.html) return String(v.html).replace(/<[^>]+>/g, " ");
  return String(v);
}

export async function POST(request: NextRequest) {
  try {
    const access = await authorize(request);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No email file was uploaded." }, { status: 400 });

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".msg") && !lower.endsWith(".eml")) {
      return NextResponse.json({ error: "Only .msg and .eml files are supported." }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Email files are limited to 15 MB." }, { status: 400 });

    const parsed: any = await parseEmail(Buffer.from(await file.arrayBuffer()), file.name);
    const attachments = Array.isArray(parsed?.attachments)
      ? parsed.attachments.map((a: any) => a?.filename || a?.fileName || a?.name).filter(Boolean).join(", ")
      : "";

    let emailText = [
      parsed?.subject ? `Subject: ${parsed.subject}` : "",
      parsed?.from ? `From: ${str(parsed.from)}` : "",
      parsed?.to ? `To: ${str(parsed.to)}` : "",
      parsed?.cc ? `CC: ${str(parsed.cc)}` : "",
      parsed?.replyTo ? `Reply-To: ${str(parsed.replyTo)}` : "",
      attachments ? `Attachments: ${attachments}` : "",
      parsed?.headers ? `\n--- MESSAGE HEADERS ---\n${str(parsed.headers)}` : "",
      (parsed?.text || parsed?.body || parsed?.textBody || parsed?.html) ? `\n--- MESSAGE BODY ---\n${str(parsed?.text || parsed?.body || parsed?.textBody || parsed?.html)}` : "",
    ].filter(Boolean).join("\n").trim();

    if (!emailText) return NextResponse.json({ error: "The email file contained no extractable text." }, { status: 422 });
    if (emailText.length > 50000) emailText = emailText.slice(0, 50000);

    return NextResponse.json({ ok: true, fileName: file.name, emailText });
  } catch (error: any) {
    console.error("Email import error", error);
    return NextResponse.json({ error: error?.message || "Could not read this Outlook email file." }, { status: 500 });
  }
}
