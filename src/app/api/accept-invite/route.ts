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
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Use getUser(token) so the identity is verified by Supabase Auth.
    const { data: userData, error: userError } =
      await userClient.auth.getUser(token);

    if (userError || !userData.user || !userData.user.email) {
      return NextResponse.json(
        { error: "Invalid invitation session" },
        { status: 401 }
      );
    }

    const email = userData.user.email.trim().toLowerCase();
    const admin = createAdminClient();

    // Primary lookup: pending invite by the authenticated employee's email.
    // This avoids depending on user_metadata being present in the session.
    const { data: invite, error: inviteError } = await admin
      .from("invitations")
      .select("id, company_id, email, role, status")
      .eq("status", "pending")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        {
          error:
            "No pending company invitation was found for this email address. Ask the administrator to send a fresh invitation.",
        },
        { status: 404 }
      );
    }

    const { error: membershipError } = await admin
      .from("memberships")
      .upsert(
        {
          company_id: invite.company_id,
          user_id: userData.user.id,
          role: invite.role || "employee",
        },
        {
          onConflict: "company_id,user_id",
        }
      );

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await admin
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id)
      .eq("status", "pending");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      companyId: invite.company_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
