import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Use the signed-in user's token only to prove identity and platform-admin access.
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: platformAdmin, error: adminCheckError } = await userClient
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminCheckError) {
      return NextResponse.json(
        { error: `Platform admin check failed: ${adminCheckError.message}` },
        { status: 500 }
      );
    }

    if (!platformAdmin) {
      return NextResponse.json(
        { error: "Platform admin access required" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id,title,video_key")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Do not destroy course records that are part of employee history/reports.
    // Deactivation is the correct action for courses that have ever been assigned.
    const { count: assignmentCount, error: assignmentError } = await admin
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (assignmentError) {
      return NextResponse.json(
        { error: `Could not check course assignments: ${assignmentError.message}` },
        { status: 500 }
      );
    }

    if ((assignmentCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `This course has ${assignmentCount} existing training assignment${assignmentCount === 1 ? "" : "s"} and cannot be permanently deleted. Deactivate it instead so employee history and reports are preserved.`,
          assignmentCount,
        },
        { status: 409 }
      );
    }

    const { error: deleteError } = await admin
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Could not delete course: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Clean up the actual Cloudflare R2 object after the database record is gone.
    // If storage cleanup fails, the course is still deleted; report the orphan so it
    // can be cleaned up without restoring a database record.
    let r2CleanupWarning: string | null = null;

    if (course.video_key) {
      try {
        await createR2Client().send(
          new DeleteObjectCommand({
            Bucket: getR2BucketName(),
            Key: course.video_key,
          })
        );
      } catch (error: any) {
        r2CleanupWarning =
          error?.message || "Course deleted, but its R2 video could not be removed.";
      }
    }

    return NextResponse.json({
      ok: true,
      title: course.title,
      deletedVideoFromR2: Boolean(course.video_key) && !r2CleanupWarning,
      warning: r2CleanupWarning,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not delete course" },
      { status: 500 }
    );
  }
}
