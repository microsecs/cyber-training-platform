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
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!adminRow) return NextResponse.json({ error: "Platform admin access required" }, { status: 403 });

    const { fileName, contentType, size } = await request.json();
    if (!String(contentType || "").startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }
    if (!size || Number(size) > 1024 * 1024 * 1024) {
      return NextResponse.json({ error: "Video must be 1 GB or smaller" }, { status: 400 });
    }

    const ext = String(fileName || "homepage.mp4")
      .split(".")
      .pop()
      ?.replace(/[^a-z0-9]/gi, "")
      .toLowerCase() || "mp4";
    const key = `homepage/${crypto.randomUUID()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      createR2Client(),
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: key,
        ContentType: contentType || "video/mp4",
      }),
      { expiresIn: 600 }
    );

    return NextResponse.json({ ok: true, key, uploadUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not create upload URL" }, { status: 500 });
  }
}
