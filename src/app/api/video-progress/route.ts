import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth } = await s.auth.getUser(token);
  if (!auth.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const { assignmentId, position, duration } = await req.json();
  if (typeof assignmentId !== "string" || !Number.isFinite(position) || !Number.isFinite(duration) || duration < 5 || duration > 14400 || position < 0 || position > duration + 1) {
    return NextResponse.json({ error: "Invalid video progress" }, { status: 400 });
  }
  const { data: assignment } = await s.from("assignments").select("id")
    .eq("id", assignmentId).eq("user_id", auth.user.id).maybeSingle();
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  // Only the server can write verified progress. Never expose the service key to clients.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: existing, error: readError } = await admin.from("video_watch_progress")
    .select("watched_seconds,last_position,last_heartbeat_at,unlocked,duration_seconds")
    .eq("assignment_id", assignmentId).eq("user_id", auth.user.id).maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (existing?.unlocked) return NextResponse.json({ unlocked: true, watchedSeconds: existing.watched_seconds });
  const now = Date.now();
  const lastAt = existing?.last_heartbeat_at ? new Date(existing.last_heartbeat_at).getTime() : now;
  const elapsed = Math.max(0, Math.min(5, (now - lastAt) / 1000));
  const previous = Number(existing?.last_position || 0);
  const delta = Math.max(0, position - previous);
  // Server-time bounded, sequential playback. No credit for a seek ahead.
  const credit = existing ? (delta > 6 ? 0 : Math.min(delta, elapsed)) : 0;
  const watched = Number(existing?.watched_seconds || 0) + credit;
  const actualDuration = existing?.duration_seconds || duration;
  const unlocked = watched >= Math.max(0, actualDuration - 3);
  const { error } = await admin.from("video_watch_progress").upsert({
    assignment_id: assignmentId, user_id: auth.user.id,
    watched_seconds: watched, last_position: delta > 6 ? previous : position,
    duration_seconds: actualDuration, last_heartbeat_at: new Date(now).toISOString(), unlocked,
  }, { onConflict: "assignment_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ unlocked, watchedSeconds: watched });
}
