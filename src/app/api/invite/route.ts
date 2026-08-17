import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const FROM_EMAIL = "MicroSECONDS Training <training@microseconds.com>";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: userData, error: userError } =
      await userClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const requestedRole =
      body.role === "admin" ? "admin" : "employee";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } =
      await userClient
        .from("memberships")
        .select("company_id,role,is_active,companies(name)")
        .eq("user_id", userData.user.id)
        .eq("is_active", true)
        .in("role", ["owner", "admin"])
        .limit(1)
        .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          error:
            "Company administrator access required",
        },
        { status: 403 }
      );
    }

    if (
      requestedRole === "admin" &&
      membership.role !== "owner"
    ) {
      return NextResponse.json(
        {
          error:
            "Only the company owner can invite another company administrator.",
        },
        { status: 403 }
      );
    }

    const companyRow: any =
      Array.isArray(membership.companies)
        ? membership.companies[0]
        : membership.companies;

    const admin = createAdminClient();

    const { data: existingInvite } = await admin
      .from("invitations")
      .select("id,status,role")
      .eq("company_id", membership.company_id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        {
          error:
            "A pending invitation already exists for this email.",
        },
        { status: 409 }
      );
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id,email")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfile) {
      const { data: existingMembership } =
        await admin
          .from("memberships")
          .select("id,role,is_active")
          .eq("company_id", membership.company_id)
          .eq("user_id", existingProfile.id)
          .maybeSingle();

      if (existingMembership) {
        return NextResponse.json(
          {
            error:
              existingMembership.role === "admin" ||
              existingMembership.role === "owner"
                ? "This person is already a company administrator."
                : "This person already belongs to this company. Use the employee-management controls instead of sending another invitation.",
          },
          { status: 409 }
        );
      }
    }

    const { data: inviteRow, error: inviteRowError } =
      await admin
        .from("invitations")
        .insert({
          company_id: membership.company_id,
          email,
          role: requestedRole,
          status: "pending",
          invited_by: userData.user.id,
        })
        .select("id")
        .single();

    if (inviteRowError || !inviteRow) {
      return NextResponse.json(
        {
          error:
            inviteRowError?.message ||
            "Could not create invitation record",
        },
        { status: 500 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin;

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          redirectTo: `${origin}/accept-invite`,
          data: {
            invited_company_id:
              membership.company_id,
            invitation_id:
              inviteRow.id,
            invited_role:
              requestedRole,
            invited_company_name:
              companyRow?.name ?? "Company",
          },
        },
      });

    if (
      linkError ||
      !linkData?.properties?.action_link
    ) {
      await admin
        .from("invitations")
        .delete()
        .eq("id", inviteRow.id);

      return NextResponse.json(
        {
          error:
            linkError?.message ||
            "Could not generate invitation link",
        },
        { status: 500 }
      );
    }

    const apiKey =
      process.env.RESEND_API_KEY;

    if (!apiKey) {
      await admin
        .from("invitations")
        .delete()
        .eq("id", inviteRow.id);

      return NextResponse.json(
        {
          error:
            "Server is missing RESEND_API_KEY",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const companyName =
      companyRow?.name ??
      "your company";

    const isAdmin =
      requestedRole === "admin";

    const { error: emailError } =
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: isAdmin
          ? `${companyName} invited you to become a MicroSECONDS administrator`
          : `${companyName} invited you to MicroSECONDS Training`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
            <div style="font-size:13px;font-weight:bold;letter-spacing:.08em;color:#0891b2;text-transform:uppercase">
              MicroSECONDS Training
            </div>

            <h1 style="font-size:28px;line-height:1.2;margin:10px 0 18px">
              ${
                isAdmin
                  ? "You're invited to become a company administrator"
                  : "You're invited to cybersecurity training"
              }
            </h1>

            <p style="font-size:16px;line-height:1.6">
              ${
                isAdmin
                  ? `${companyName} has invited you to help administer its MicroSECONDS Training account.`
                  : `${companyName} has invited you to join its MicroSECONDS cybersecurity training account.`
              }
            </p>

            ${
              isAdmin
                ? `<p style="font-size:16px;line-height:1.6">
                    As a company administrator, you'll be able to manage employees, assign training, and review company training reports.
                   </p>`
                : ""
            }

            <p style="margin:28px 0">
              <a
                href="${linkData.properties.action_link}"
                style="display:inline-block;background:#22d3ee;color:#082f49;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold"
              >
                Accept Invitation
              </a>
            </p>

            <p style="font-size:13px;line-height:1.5;color:#64748b">
              If you were not expecting this invitation, you can ignore this email.
            </p>

            <p style="margin-top:28px;font-size:13px;color:#64748b">
              MicroSECONDS Training<br />
              Cybersecurity Awareness Training
            </p>
          </div>
        `,
      });

    if (emailError) {
      await admin
        .from("invitations")
        .delete()
        .eq("id", inviteRow.id);

      return NextResponse.json(
        { error: emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      role: requestedRole,
      message:
        requestedRole === "admin"
          ? `Administrator invitation sent to ${email}`
          : `Invitation sent to ${email}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
