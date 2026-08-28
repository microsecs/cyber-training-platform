import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const courseId = request.nextUrl.searchParams.get("courseId");

    if (!token || !courseId) {
      return NextResponse.json(
        { error: "Missing authentication or course" },
        { status: 400 }
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

    if (course.video_key) {
      const videoUrl = await getSignedUrl(
        createR2Client(),
        new GetObjectCommand({
          Bucket: getR2BucketName(),
          Key: course.video_key,
        }),
        { expiresIn: 3600 }
      );

      return NextResponse.json({
        ok: true,
        videoUrl,
        source: "r2",
      });
    }

    if (course.video_url) {
      return NextResponse.json({
        ok: true,
        videoUrl: course.video_url,
        source: "external",
      });
    }

    return NextResponse.json(
      { error: "No video is configured for this course" },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not create preview URL" },
      { status: 500 }
    );
  }
}
