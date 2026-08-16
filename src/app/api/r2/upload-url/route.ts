import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!adminRow) return NextResponse.json({ error: "Platform admin required" }, { status: 403 });

    const { fileName, contentType, size } = await request.json();
    if (!String(contentType || "").startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }
    if (!size || size > 1024 * 1024 * 1024) {
      return NextResponse.json({ error: "Video must be 1 GB or smaller" }, { status: 400 });
    }

    const ext = String(fileName || "video.mp4").split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp4";
    const key = `courses/${crypto.randomUUID()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      createR2Client(),
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );

    return NextResponse.json({ ok: true, key, uploadUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload setup failed" }, { status: 500 });
  }
}
