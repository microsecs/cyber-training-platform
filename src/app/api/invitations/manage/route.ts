import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const FROM_EMAIL = "MicroSECONDS Training <training@microseconds.com>";

async function sendReminder({
  admin,
  resend,
  email,
  companyId,
  companyName,
  invitationId,
  origin,
}: {
  admin: ReturnType<typeof createAdminClient>;
  resend: Resend;
  email: string;
  companyId: string;
  companyName: string;
  invitationId: string;
  origin: string;
}) {
  // A reminder targets an already-created pending auth user, so a magic link is
  // more reliable than trying to create another Supabase invite user.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}/accept-invite`,
      data: {
        invited_company_id: companyId,
        invitation_id: invitationId,
        invited_role: "employee",
        invited_company_name: companyName,
      },
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    throw new Error(linkError?.message || `Could not generate a reminder link for ${email}`);
  }

  const { error: emailError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Reminder: ${companyName} invited you to MicroSECONDS Training`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
      <div style="font-size:13px;font-weight:bold;letter-spacing:.08em;color:#0891b2;text-transform:uppercase">MicroSECONDS Training</div>
      <h1 style="font-size:28px;line-height:1.2;margin:10px 0 18px">Your training invitation is waiting</h1>
      <p style="font-size:16px;line-height:1.6">${companyName} previously invited you to join its MicroSECONDS cybersecurity training account.</p>
      <p style="font-size:16px;line-height:1.6">Use the button below to activate your account and begin your assigned training.</p>
      <p style="margin:28px 0"><a href="${linkData.properties.action_link}" style="display:inline-block;background:#22d3ee;color:#082f49;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold">Accept Invitation</a></p>
      <p style="font-size:13px;color:#64748b">If you already completed your registration, you can ignore this reminder.</p>
      <p style="margin-top:28px;font-size:13px;color:#64748b">MicroSECONDS Training<br />Cybersecurity Awareness Training</p>
    </div>`,
  });

  if (emailError) throw new Error(emailError.message);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { data: membership, error: membershipError } = await userClient
      .from("memberships")
      .select("company_id,role,companies(name)")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Company administrator access required" }, { status: 403 });
    }

    const body = await request.json();
    const action = String(body.action || "");
    const invitationId = body.invitationId ? String(body.invitationId) : null;
    const admin = createAdminClient();

    if (action === "delete") {
      if (!invitationId) return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });

      const { data: invite, error: inviteError } = await admin
        .from("invitations")
        .select("id,email,status")
        .eq("id", invitationId)
        .eq("company_id", membership.company_id)
        .eq("status", "pending")
        .maybeSingle();

      if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 });
      if (!invite) return NextResponse.json({ error: "Pending invitation not found" }, { status: 404 });

      const { error: deleteError } = await admin
        .from("invitations")
        .delete()
        .eq("id", invitationId)
        .eq("company_id", membership.company_id)
        .eq("status", "pending");

      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
      return NextResponse.json({ ok: true, message: `Invitation for ${invite.email} deleted.` });
    }

    if (action !== "remind" && action !== "remind_all") {
      return NextResponse.json({ error: "Unsupported invitation action" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Server is missing RESEND_API_KEY" }, { status: 500 });

    let query = admin
      .from("invitations")
      .select("id,email,status")
      .eq("company_id", membership.company_id)
      .eq("status", "pending");

    if (action === "remind") {
      if (!invitationId) return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
      query = query.eq("id", invitationId);
    }

    const { data: invitations, error: invitationError } = await query.order("created_at", { ascending: true });
    if (invitationError) return NextResponse.json({ error: invitationError.message }, { status: 500 });
    if (!invitations?.length) {
      return NextResponse.json({ error: action === "remind_all" ? "There are no pending invitations to remind." : "Pending invitation not found." }, { status: 404 });
    }

    const companyRow: any = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;
    const companyName = companyRow?.name ?? "Your company";
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const resend = new Resend(apiKey);

    let sent = 0;
    const failures: string[] = [];

    for (const invite of invitations) {
      try {
        await sendReminder({
          admin,
          resend,
          email: invite.email,
          companyId: membership.company_id,
          companyName,
          invitationId: invite.id,
          origin,
        });
        sent += 1;
      } catch (error: any) {
        failures.push(`${invite.email}: ${error?.message || "Could not send"}`);
      }
    }

    if (sent === 0) {
      return NextResponse.json({ error: failures[0] || "Could not send invitation reminder." }, { status: 500 });
    }

    const message =
      action === "remind_all"
        ? `Reminder${sent === 1 ? "" : "s"} sent to ${sent} pending invitation${sent === 1 ? "" : "s"}${failures.length ? `; ${failures.length} failed.` : "."}`
        : `Reminder sent to ${invitations[0].email}.`;

    return NextResponse.json({ ok: true, sent, failed: failures.length, message, failures });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
