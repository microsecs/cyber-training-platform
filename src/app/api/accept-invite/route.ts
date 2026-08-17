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
      .select("id,is_active")
      .eq("company_id", invite.company_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (existingMembership && existingMembership.is_active === false) {
      const { error: reactivateError } = await admin
        .from("memberships")
        .update({ is_active: true })
        .eq("id", existingMembership.id);

      if (reactivateError) {
        return NextResponse.json({ error: reactivateError.message }, { status: 500 });
      }
    }

    if (!existingMembership) {
      const { error: membershipError } = await admin
        .from("memberships")
        .upsert(
          {
            company_id: invite.company_id,
            user_id: userData.user.id,
            role: invite.role || "employee",
            is_active: true,
          },
          { onConflict: "company_id,user_id" }
        );

      if (membershipError) {
        return NextResponse.json({ error: membershipError.message }, { status: 500 });
      }
    }

    // Convert any training assigned while this employee was still pending
    // into normal user-ID-based assignments.
    const { data: pendingAssignments, error: pendingError } = await admin
      .from("pending_assignments")
      .select("id,company_id,course_id,due_date,quiz_required,reminders_enabled,assigned_by")
      .eq("invitation_id", invite.id);

    if (pendingError) {
      return NextResponse.json({ error: pendingError.message }, { status: 500 });
    }

    if (pendingAssignments && pendingAssignments.length > 0) {
      const courseIds = pendingAssignments.map((row) => row.course_id);

      const { data: activeAssignments, error: activeError } = await admin
        .from("assignments")
        .select("course_id,status")
        .eq("company_id", invite.company_id)
        .eq("user_id", userData.user.id)
        .in("course_id", courseIds)
        .neq("status", "completed");

      if (activeError) {
        return NextResponse.json({ error: activeError.message }, { status: 500 });
      }

      const activeCourseIds = new Set(
        (activeAssignments ?? []).map((row) => row.course_id)
      );

      const rowsToInsert = pendingAssignments
        .filter((row) => !activeCourseIds.has(row.course_id))
        .map((row) => ({
          company_id: row.company_id,
          course_id: row.course_id,
          user_id: userData.user!.id,
          due_date: row.due_date,
          assigned_by: row.assigned_by,
          status: "not_started",
          quiz_required: row.quiz_required,
          reminders_enabled: row.reminders_enabled,
        }));

      if (rowsToInsert.length > 0) {
        const { error: assignmentInsertError } = await admin
          .from("assignments")
          .insert(rowsToInsert);

        if (assignmentInsertError) {
          return NextResponse.json(
            { error: assignmentInsertError.message },
            { status: 500 }
          );
        }
      }

      const { error: deletePendingError } = await admin
        .from("pending_assignments")
        .delete()
        .eq("invitation_id", invite.id);

      if (deletePendingError) {
        return NextResponse.json(
          { error: deletePendingError.message },
          { status: 500 }
        );
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
