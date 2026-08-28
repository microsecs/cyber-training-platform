import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
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
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json(
        { error: `Platform admin check failed: ${adminError.message}` },
        { status: 500 }
      );
    }

    if (!adminRow) {
      return NextResponse.json(
        { error: "Platform admin access required" },
        { status: 403 }
      );
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,video_key,video_url")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.video_key && !course.video_url) {
      return NextResponse.json(
        { error: "This course does not have a video attached" },
        { status: 400 }
      );
    }

    // If the course uses Cloudflare R2, remove the actual stored object first.
    // For external URLs, there is no R2 object to delete; we only detach the URL.
    if (course.video_key) {
      await createR2Client().send(
        new DeleteObjectCommand({
          Bucket: getR2BucketName(),
          Key: course.video_key,
        })
      );
    }

    const { error: updateError } = await supabase
      .from("courses")
      .update({
        video_key: null,
        video_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);

    if (updateError) {
      return NextResponse.json(
        {
          error: `Video was removed from storage, but the course record could not be updated: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      deletedFromR2: Boolean(course.video_key),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not delete course video" },
      { status: 500 }
    );
  }
}
