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

  const { courseId, userIds, dueDate, quizRequired } = await req.json();

  const { data: membership } = await s
    .from("memberships")
    .select("company_id,role")
    .eq("user_id", userData.user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const rows = (userIds || []).map((userId: string) => ({
    company_id: membership.company_id,
    course_id: courseId,
    user_id: userId,
    due_date: dueDate || null,
    assigned_by: userData.user!.id,
    status: "not_started",
    quiz_required: quizRequired !== false,
  }));

  if (!rows.length) {
    return NextResponse.json({ error: "Select at least one employee" }, { status: 400 });
  }

  const { error } = await s
    .from("assignments")
    .upsert(rows, {
      onConflict: "company_id,course_id,user_id",
      ignoreDuplicates: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
