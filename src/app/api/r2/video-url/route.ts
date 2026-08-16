import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const assignmentId = request.nextUrl.searchParams.get("assignmentId");
    if (!token || !assignmentId) {
      return NextResponse.json({ error: "Missing authentication or assignment" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { data: assignment } = await supabase
      .from("assignments")
      .select("id,user_id,courses(video_key,video_url)")
      .eq("id", assignmentId)
      .eq("user_id", userData.user.id)
      .single();

    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const course: any = Array.isArray(assignment.courses) ? assignment.courses[0] : assignment.courses;

    if (course?.video_key) {
      const videoUrl = await getSignedUrl(
        createR2Client(),
        new GetObjectCommand({ Bucket: getR2BucketName(), Key: course.video_key }),
        { expiresIn: 3600 }
      );
      return NextResponse.json({ ok: true, videoUrl, source: "r2" });
    }

    if (course?.video_url) {
      return NextResponse.json({ ok: true, videoUrl: course.video_url, source: "external" });
    }

    return NextResponse.json({ error: "No video configured" }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Playback setup failed" }, { status: 500 });
  }
}
