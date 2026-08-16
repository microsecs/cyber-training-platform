import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser(token);

    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: "Invalid invitation session" }, { status: 401 });
    }

    const email = userData.user.email.trim().toLowerCase();
    const admin = createAdminClient();

    const { data: invites, error: inviteError } = await admin
      .from("invitations")
      .select("id, company_id, email, role, status, created_at")
      .ilike("email", email)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false })
      .limit(5);

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    if (!invites || invites.length === 0) {
      return NextResponse.json(
        { error: "No company invitation was found for this email address. Ask the administrator to send a fresh invitation." },
        { status: 404 }
      );
    }

    const invite = invites.find((x) => x.status === "pending") ?? invites[0];

    const { data: existingMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("company_id", invite.company_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!existingMembership) {
      const { error: membershipError } = await admin
        .from("memberships")
        .upsert(
          {
            company_id: invite.company_id,
            user_id: userData.user.id,
            role: invite.role || "employee",
          },
          { onConflict: "company_id,user_id" }
        );

      if (membershipError) {
        return NextResponse.json({ error: membershipError.message }, { status: 500 });
      }
    }

    if (invite.status !== "accepted") {
      const { error: updateError } = await admin
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      companyId: invite.company_id,
      recovered: invite.status === "accepted",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
