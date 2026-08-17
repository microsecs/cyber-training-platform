import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const FROM_EMAIL = "MicroSECONDS Training <training@microseconds.com>";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const admin = createAdminClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists for that email, a password reset message has been sent.",
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server is missing RESEND_API_KEY" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your MicroSECONDS Training password",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
          <div style="font-size:13px;font-weight:bold;letter-spacing:.08em;color:#0891b2;text-transform:uppercase">MicroSECONDS Training</div>
          <h1 style="font-size:28px;line-height:1.2;margin:10px 0 18px">Reset your password</h1>
          <p style="font-size:16px;line-height:1.6">We received a request to reset the password for your MicroSECONDS Training account.</p>
          <p style="font-size:16px;line-height:1.6">Use the button below to choose a new password.</p>
          <p style="margin:28px 0">
            <a href="${linkData.properties.action_link}" style="display:inline-block;background:#22d3ee;color:#082f49;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold">Reset Password</a>
          </p>
          <p style="font-size:13px;line-height:1.5;color:#64748b">If you did not request a password reset, you can ignore this email.</p>
          <p style="margin-top:28px;font-size:13px;color:#64748b">MicroSECONDS Training<br />Cybersecurity Awareness Training</p>
        </div>`,
    });

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a password reset message has been sent.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not send password reset email" }, { status: 500 });
  }
}
