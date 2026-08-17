import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );
  }

  const {
    courseId,
    userIds,
    dueDate,
    quizRequired,
    remindersEnabled,
  } = await req.json();

  if (
    !courseId ||
    !Array.isArray(userIds) ||
    userIds.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Choose a course and at least one employee.",
      },
      { status: 400 }
    );
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("memberships")
      .select("company_id,role")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const effectiveRemindersEnabled =
    Boolean(dueDate) &&
    remindersEnabled !== false;

  // Check for CURRENT incomplete assignments.
  // We allow reassignment after completion, but we don't want
  // duplicate active assignments for the same course/user.
  const { data: existingActive, error: existingError } =
    await supabase
      .from("assignments")
      .select("user_id,status")
      .eq("company_id", membership.company_id)
      .eq("course_id", courseId)
      .in("user_id", userIds)
      .neq("status", "completed");

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message },
      { status: 400 }
    );
  }

  const activeUserIds = new Set(
    (existingActive ?? []).map((row) => row.user_id)
  );

  const assignableUserIds = userIds.filter(
    (userId: string) => !activeUserIds.has(userId)
  );

  if (assignableUserIds.length === 0) {
    return NextResponse.json(
      {
        error:
          "Each selected employee already has an active assignment for this course.",
      },
      { status: 409 }
    );
  }

  const rows = assignableUserIds.map(
    (userId: string) => ({
      company_id: membership.company_id,
      course_id: courseId,
      user_id: userId,
      due_date: dueDate || null,
      assigned_by: userData.user!.id,
      status: "not_started",
      quiz_required: quizRequired !== false,
      reminders_enabled:
        effectiveRemindersEnabled,
    })
  );

  const { data: inserted, error: insertError } =
    await supabase
      .from("assignments")
      .insert(rows)
      .select("id,user_id");

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    count: inserted?.length ?? 0,
    skippedActive:
      userIds.length - assignableUserIds.length,
    remindersEnabled:
      effectiveRemindersEnabled,
  });
}
