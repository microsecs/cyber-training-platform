import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

import { getUserCompanySubscriptionAccess } from "@/lib/subscriptionServer";
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const subscriptionAccess = await getUserCompanySubscriptionAccess(userData.user.id);
    if (!subscriptionAccess.allowed) {
      return NextResponse.json(
        { error: "An active MicroSECONDS subscription is required for this company-management action." },
        { status: 402 }
      );
    }

    const { membershipId, confirmation } = await request.json();

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Type DELETE to permanently remove this employee.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: target } = await admin
      .from("memberships")
      .select("id,user_id,company_id,role")
      .eq("id", membershipId)
      .single();

    if (!target || target.role !== "employee") {
      return NextResponse.json({ error: "Employee membership not found" }, { status: 404 });
    }

    const { data: requester } = await admin
      .from("memberships")
      .select("role")
      .eq("company_id", target.company_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (!requester) {
      return NextResponse.json({ error: "Company admin access required" }, { status: 403 });
    }

    // Do not delete an Auth user if the same person belongs to another company.
    const { data: otherMemberships } = await admin
      .from("memberships")
      .select("id,company_id")
      .eq("user_id", target.user_id)
      .neq("company_id", target.company_id);

    if ((otherMemberships ?? []).length > 0) {
      return NextResponse.json(
        {
          error:
            "This user belongs to another company. Deactivate this company membership instead of permanently deleting the Auth account.",
        },
        { status: 409 }
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", target.user_id)
      .maybeSingle();

    const { data: assignments } = await admin
      .from("assignments")
      .select("id")
      .eq("company_id", target.company_id)
      .eq("user_id", target.user_id);

    const assignmentIds = (assignments ?? []).map((a) => a.id);

    if (assignmentIds.length) {
      const { error: reminderError } = await admin
        .from("training_reminders")
        .delete()
        .in("assignment_id", assignmentIds);
      if (reminderError) throw reminderError;

      const { error: completionError } = await admin
        .from("completions")
        .delete()
        .in("assignment_id", assignmentIds);
      if (completionError) throw completionError;

      const { error: assignmentError } = await admin
        .from("assignments")
        .delete()
        .in("id", assignmentIds);
      if (assignmentError) throw assignmentError;
    }

    const { error: membershipError } = await admin
      .from("memberships")
      .delete()
      .eq("company_id", target.company_id)
      .eq("user_id", target.user_id);
    if (membershipError) throw membershipError;

    if (profile?.email) {
      const { error: inviteError } = await admin
        .from("invitations")
        .delete()
        .eq("company_id", target.company_id)
        .ilike("email", profile.email);
      if (inviteError) throw inviteError;
    }

    // Remove any accidental platform-admin record before deleting Auth.
    await admin.from("platform_admins").delete().eq("user_id", target.user_id);

    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", target.user_id);
    if (profileError) throw profileError;

    const { error: authError } = await admin.auth.admin.deleteUser(target.user_id);
    if (authError) throw authError;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not permanently delete employee" },
      { status: 500 }
    );
  }
}
