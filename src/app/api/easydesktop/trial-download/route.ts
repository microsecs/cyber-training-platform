import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("easydesktop_settings")
      .select("trial_object_key,trial_file_name")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.trial_object_key) {
      return NextResponse.json(
        { error: "The EasyDesktop trial download is not currently available." },
        { status: 404 }
      );
    }

    const safeName =
      String(data.trial_file_name || "EasyDesktop-10-Trial.zip")
        .replace(/[\\/:*?"<>|]/g, "_")
        .slice(0, 180) || "EasyDesktop-10-Trial.zip";

    const url = await getSignedUrl(
      createR2Client(),
      new GetObjectCommand({
        Bucket: getR2BucketName(),
        Key: data.trial_object_key,
        ResponseContentDisposition: `attachment; filename="${safeName}"`,
        ResponseContentType: "application/octet-stream",
      }),
      { expiresIn: 300 }
    );

    return NextResponse.redirect(url, 302);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not create EasyDesktop trial download." },
      { status: 500 }
    );
  }
}
