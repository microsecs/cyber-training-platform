import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await req.json();
    const courseId = String(body.courseId || "");
    const dueDate = body.dueDate || null;
    const quizRequired = body.quizRequired !== false;
    const remindersEnabled = body.remindersEnabled;

    // New format uses typed targets. Legacy userIds are still accepted so this
    // route remains compatible with older cached clients during deployment.
    const rawTargets: string[] = Array.isArray(body.targets)
      ? body.targets.map(String)
      : Array.isArray(body.userIds)
      ? body.userIds.map((id: string) => `user:${id}`)
      : [];

    const userIds = Array.from(
      new Set(
        rawTargets
          .filter((target) => target.startsWith("user:"))
          .map((target) => target.slice(5))
          .filter(Boolean)
      )
    );

    const invitationIds = Array.from(
      new Set(
        rawTargets
          .filter((target) => target.startsWith("invite:"))
          .map((target) => target.slice(7))
          .filter(Boolean)
      )
    );

    if (!courseId || userIds.length + invitationIds.length === 0) {
      return NextResponse.json(
        { error: "Choose a course and at least one employee." },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("company_id,role")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const effectiveRemindersEnabled = Boolean(dueDate) && remindersEnabled !== false;
    const admin = createAdminClient();

    let validUserIds: string[] = [];
    if (userIds.length) {
      const { data: validMembers, error: validMemberError } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("company_id", membership.company_id)
        .eq("role", "employee")
        .in("user_id", userIds);

      if (validMemberError) {
        return NextResponse.json({ error: validMemberError.message }, { status: 400 });
      }

      validUserIds = (validMembers ?? []).map((row) => row.user_id);
    }

    let validInvitationIds: string[] = [];
    if (invitationIds.length) {
      const { data: validInvites, error: validInviteError } = await admin
        .from("invitations")
        .select("id")
        .eq("company_id", membership.company_id)
        .eq("status", "pending")
        .in("id", invitationIds);

      if (validInviteError) {
        return NextResponse.json({ error: validInviteError.message }, { status: 400 });
      }

      validInvitationIds = (validInvites ?? []).map((row) => row.id);
    }

    let assignableUserIds = validUserIds;
    if (validUserIds.length) {
      const { data: existingActive, error: existingError } = await supabase
        .from("assignments")
        .select("user_id,status")
        .eq("company_id", membership.company_id)
        .eq("course_id", courseId)
        .in("user_id", validUserIds)
        .neq("status", "completed");

      if (existingError) {
        return NextResponse.json({ error: existingError.message }, { status: 400 });
      }

      const activeUserIds = new Set((existingActive ?? []).map((row) => row.user_id));
      assignableUserIds = validUserIds.filter((userId) => !activeUserIds.has(userId));
    }

    let assignableInvitationIds = validInvitationIds;
    if (validInvitationIds.length) {
      const { data: existingPending, error: pendingLookupError } = await admin
        .from("pending_training_assignments")
        .select("invitation_id")
        .eq("company_id", membership.company_id)
        .eq("course_id", courseId)
        .in("invitation_id", validInvitationIds);

      if (pendingLookupError) {
        return NextResponse.json({ error: pendingLookupError.message }, { status: 400 });
      }

      const alreadyPending = new Set(
        (existingPending ?? []).map((row) => row.invitation_id)
      );
      assignableInvitationIds = validInvitationIds.filter(
        (inviteId) => !alreadyPending.has(inviteId)
      );
    }

    if (assignableUserIds.length + assignableInvitationIds.length === 0) {
      return NextResponse.json(
        { error: "Each selected employee already has an active or pending assignment for this course." },
        { status: 409 }
      );
    }

    let activeInsertedCount = 0;
    if (assignableUserIds.length) {
      const rows = assignableUserIds.map((userId) => ({
        company_id: membership.company_id,
        course_id: courseId,
        user_id: userId,
        due_date: dueDate,
        assigned_by: userData.user!.id,
        status: "not_started",
        quiz_required: quizRequired,
        reminders_enabled: effectiveRemindersEnabled,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("assignments")
        .insert(rows)
        .select("id,user_id");

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }

      activeInsertedCount = inserted?.length ?? 0;
    }

    let pendingInsertedCount = 0;
    if (assignableInvitationIds.length) {
      const pendingRows = assignableInvitationIds.map((invitationId) => ({
        invitation_id: invitationId,
        company_id: membership.company_id,
        course_id: courseId,
        due_date: dueDate,
        quiz_required: quizRequired,
        reminders_enabled: effectiveRemindersEnabled,
        assigned_by: userData.user!.id,
      }));

      const { data: insertedPending, error: pendingInsertError } = await admin
        .from("pending_training_assignments")
        .insert(pendingRows)
        .select("id,invitation_id");

      if (pendingInsertError) {
        return NextResponse.json(
          {
            error:
              activeInsertedCount > 0
                ? `Active employee assignments were saved, but pending-invitation assignments failed: ${pendingInsertError.message}`
                : pendingInsertError.message,
          },
          { status: 400 }
        );
      }

      pendingInsertedCount = insertedPending?.length ?? 0;
    }

    const skippedActive =
      rawTargets.length - activeInsertedCount - pendingInsertedCount;

    return NextResponse.json({
      ok: true,
      count: activeInsertedCount + pendingInsertedCount,
      activeCount: activeInsertedCount,
      pendingCount: pendingInsertedCount,
      skippedActive: Math.max(0, skippedActive),
      remindersEnabled: effectiveRemindersEnabled,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
