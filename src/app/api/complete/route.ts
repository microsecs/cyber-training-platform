import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  const { data: userData } = await s.auth.getUser(token);
  if (!userData.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { assignmentId, score } = await req.json();

  const { data: assignment, error: assignmentError } = await s
    .from("assignments")
    .select("id,user_id,quiz_required,courses(passing_score)")
    .eq("id", assignmentId)
    .eq("user_id", userData.user.id)
    .single();

  if (assignmentError || !assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const course = Array.isArray(assignment.courses)
    ? assignment.courses[0]
    : assignment.courses;

  const passingScore = course?.passing_score ?? 80;

  if (assignment.quiz_required) {
    if (typeof score !== "number") {
      return NextResponse.json({ error: "Quiz score required" }, { status: 400 });
    }

    if (score < passingScore) {
      return NextResponse.json({
        ok: true,
        passed: false,
        passingScore,
      });
    }
  }

  const completionPayload = {
    assignment_id: assignmentId,
    user_id: userData.user.id,
    score: assignment.quiz_required ? score : null,
    completed_at: new Date().toISOString(),
  };

  const { error: completionError } = await s
    .from("completions")
    .upsert(completionPayload, { onConflict: "assignment_id" });

  if (completionError) {
    return NextResponse.json({ error: completionError.message }, { status: 400 });
  }

  const { error: assignmentUpdateError } = await s
    .from("assignments")
    .update({ status: "completed" })
    .eq("id", assignmentId)
    .eq("user_id", userData.user.id);

  if (assignmentUpdateError) {
    return NextResponse.json({ error: assignmentUpdateError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    passed: true,
    quizRequired: assignment.quiz_required,
    passingScore,
  });
}
