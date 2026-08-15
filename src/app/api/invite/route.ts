import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    const userClient = createClient(url, publishableKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    // Determine the requester's company and verify admin/owner role using their own RLS session.
    const { data: membership, error: membershipError } = await userClient
      .from("memberships")
      .select("company_id, role, companies(name)")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Company administrator access required" }, { status: 403 });
    }

    const companyRow: any = Array.isArray(membership.companies)
      ? membership.companies[0]
      : membership.companies;

    const admin = createAdminClient();

    // Avoid duplicate pending invites.
    const { data: existingInvite } = await admin
      .from("invitations")
      .select("id, status")
      .eq("company_id", membership.company_id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json({ error: "A pending invitation already exists for this email." }, { status: 409 });
    }

    const { data: inviteRow, error: inviteRowError } = await admin
      .from("invitations")
      .insert({
        company_id: membership.company_id,
        email,
        role: "employee",
        status: "pending",
        invited_by: userData.user.id,
      })
      .select("id")
      .single();

    if (inviteRowError || !inviteRow) {
      return NextResponse.json(
        { error: inviteRowError?.message || "Could not create invitation record" },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/accept-invite`,
      data: {
        invited_company_id: membership.company_id,
        invitation_id: inviteRow.id,
        invited_role: "employee",
        invited_company_name: companyRow?.name ?? "Company",
      },
    });

    if (inviteError) {
      // Keep the database tidy if the Auth invite could not be sent.
      await admin.from("invitations").delete().eq("id", inviteRow.id);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Invitation sent to ${email}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
