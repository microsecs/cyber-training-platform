import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const key = request.nextUrl.searchParams.get("key");
    if (!token || !key) return NextResponse.json({ error: "Missing authentication or video key" }, { status: 400 });
    if (!key.startsWith("homepage/")) return NextResponse.json({ error: "Invalid homepage video key" }, { status: 400 });

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

    const videoUrl = await getSignedUrl(
      createR2Client(),
      new GetObjectCommand({ Bucket: getR2BucketName(), Key: key }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({ ok: true, videoUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not create preview URL" }, { status: 500 });
  }
}
