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

    const { data: userData, error: userError } =
      await userClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid invitation session" }, { status: 401 });
    }

    const metadata = userData.user.user_metadata || {};
    const invitationId = metadata.invitation_id;
    const companyId = metadata.invited_company_id;
    const invitedRole = metadata.invited_role || "employee";

    if (!invitationId || !companyId) {
      return NextResponse.json(
        { error: "This account does not contain a valid company invitation." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: invite, error: inviteError } = await admin
      .from("invitations")
      .select("id, company_id, email, role, status")
      .eq("id", invitationId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invitation record not found." }, { status: 404 });
    }

    if (
      invite.email.toLowerCase() !==
      (userData.user.email || "").toLowerCase()
    ) {
      return NextResponse.json(
        { error: "This invitation belongs to a different email address." },
        { status: 403 }
      );
    }

    const { error: membershipError } = await admin
      .from("memberships")
      .upsert(
        {
          company_id: companyId,
          user_id: userData.user.id,
          role: invitedRole,
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
      .eq("id", invitationId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
