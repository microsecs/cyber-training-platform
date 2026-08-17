import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const FROM_EMAIL = "MicroSECONDS Training <training@microseconds.com>";

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

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });

    const { data: membership, error: membershipError } = await userClient
      .from("memberships").select("company_id, role, companies(name)")
      .eq("user_id", userData.user.id).in("role", ["owner", "admin"]).limit(1).single();

    if (membershipError || !membership) return NextResponse.json({ error: "Company administrator access required" }, { status: 403 });

    const companyRow: any = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;
    const admin = createAdminClient();

    const { data: existingInvite } = await admin.from("invitations").select("id,status")
      .eq("company_id", membership.company_id).eq("email", email).eq("status", "pending").maybeSingle();

    if (existingInvite) return NextResponse.json({ error: "A pending invitation already exists for this email." }, { status: 409 });

    const { data: inviteRow, error: inviteRowError } = await admin.from("invitations").insert({
      company_id: membership.company_id, email, role: "employee", status: "pending", invited_by: userData.user.id,
    }).select("id").single();

    if (inviteRowError || !inviteRow) return NextResponse.json({ error: inviteRowError?.message || "Could not create invitation record" }, { status: 500 });

    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite", email,
      options: {
        redirectTo: `${origin}/accept-invite`,
        data: {
          invited_company_id: membership.company_id,
          invitation_id: inviteRow.id,
          invited_role: "employee",
          invited_company_name: companyRow?.name ?? "Company",
        },
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      await admin.from("invitations").delete().eq("id", inviteRow.id);
      return NextResponse.json({ error: linkError?.message || "Could not generate invitation link" }, { status: 500 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      await admin.from("invitations").delete().eq("id", inviteRow.id);
      return NextResponse.json({ error: "Server is missing RESEND_API_KEY" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const companyName = companyRow?.name ?? "your company";
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL, to: email,
      subject: `${companyName} invited you to MicroSECONDS Training`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
        <div style="font-size:13px;font-weight:bold;letter-spacing:.08em;color:#0891b2;text-transform:uppercase">MicroSECONDS Training</div>
        <h1 style="font-size:28px;line-height:1.2;margin:10px 0 18px">You're invited to cybersecurity training</h1>
        <p style="font-size:16px;line-height:1.6">${companyName} has invited you to join its MicroSECONDS cybersecurity training account.</p>
        <p style="margin:28px 0"><a href="${linkData.properties.action_link}" style="display:inline-block;background:#22d3ee;color:#082f49;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold">Accept Invitation</a></p>
        <p style="font-size:13px;color:#64748b">If you were not expecting this invitation, you can ignore this email.</p>
        <p style="margin-top:28px;font-size:13px;color:#64748b">MicroSECONDS Training<br />Cybersecurity Awareness Training</p>
      </div>`,
    });

    if (emailError) {
      await admin.from("invitations").delete().eq("id", inviteRow.id);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: `Invitation sent to ${email}` });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
