import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

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
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: requester, error: requesterError } = await userClient
      .from("memberships")
      .select("company_id,role")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json({ error: "Company administrator access required" }, { status: 403 });
    }

    const body = await request.json();
    const action = String(body.action || "");
    const targetUserId = String(body.userId || "");

    if (!targetUserId) {
      return NextResponse.json({ error: "Employee user ID is required" }, { status: 400 });
    }
    if (targetUserId === userData.user.id) {
      return NextResponse.json({ error: "You cannot remove your own company administrator account here." }, { status: 400 });
    }
    if (action !== "remove" && action !== "delete_data") {
      return NextResponse.json({ error: "Unsupported employee action" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: targetMembership, error: targetError } = await admin
      .from("memberships")
      .select("id,user_id,role")
      .eq("company_id", requester.company_id)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
    if (!targetMembership) return NextResponse.json({ error: "Employee is not a member of this company." }, { status: 404 });
    if (targetMembership.role !== "employee") {
      return NextResponse.json({ error: "Owner and administrator accounts cannot be removed from this employee action." }, { status: 400 });
    }

    let displayName = targetUserId;
    const { data: profile } = await admin
      .from("profiles")
      .select("email,full_name")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profile?.full_name || profile?.email) displayName = profile.full_name || profile.email;

    if (action === "delete_data") {
      const { data: assignments, error: assignmentLookupError } = await admin
        .from("assignments")
        .select("id")
        .eq("company_id", requester.company_id)
        .eq("user_id", targetUserId);

      if (assignmentLookupError) {
        return NextResponse.json({ error: assignmentLookupError.message }, { status: 500 });
      }

      const assignmentIds = (assignments ?? []).map((row: any) => row.id);

      if (assignmentIds.length) {
        const { error: completionError } = await admin
          .from("completions")
          .delete()
          .in("assignment_id", assignmentIds);

        if (completionError) {
          return NextResponse.json({ error: completionError.message }, { status: 500 });
        }

        const { error: assignmentError } = await admin
          .from("assignments")
          .delete()
          .in("id", assignmentIds);

        if (assignmentError) {
          return NextResponse.json({ error: assignmentError.message }, { status: 500 });
        }
      }
    }

    const { error: membershipDeleteError } = await admin
      .from("memberships")
      .delete()
      .eq("id", targetMembership.id);

    if (membershipDeleteError) {
      return NextResponse.json({ error: membershipDeleteError.message }, { status: 500 });
    }

    if (action === "delete_data") {
      // If the person belongs to no other companies, clean up the standalone
      // profile/auth account too. Otherwise leave the account for the other company.
      const { data: remainingMemberships } = await admin
        .from("memberships")
        .select("id")
        .eq("user_id", targetUserId)
        .limit(1);

      if (!remainingMemberships?.length) {
        await admin.from("profiles").delete().eq("id", targetUserId);
        await admin.auth.admin.deleteUser(targetUserId);
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        action === "delete_data"
          ? `${displayName} was removed and this company's training data was deleted.`
          : `${displayName} was removed from the company.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
