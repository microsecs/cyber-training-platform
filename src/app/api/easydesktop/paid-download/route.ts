import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";
import { recordEasyDesktopPurchase } from "@/lib/easydesktopPurchase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const sessionId = String(
      request.nextUrl.searchParams.get("session_id") || ""
    ).trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing purchase session." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.mode !== "payment" ||
      session.metadata?.product_key !== "easydesktop10" ||
      session.payment_status !== "paid"
    ) {
      return NextResponse.json(
        { error: "A completed EasyDesktop purchase is required." },
        { status: 403 }
      );
    }

    await recordEasyDesktopPurchase(session);

    const admin = createAdminClient();
    const { data: settings, error } = await admin
      .from("easydesktop_settings")
      .select("full_object_key,full_file_name")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!settings?.full_object_key) {
      return NextResponse.json(
        {
          error:
            "The EasyDesktop full-version download has not been uploaded yet. Please contact support@microseconds.com.",
        },
        { status: 404 }
      );
    }

    const safeName =
      String(settings.full_file_name || "EasyDesktop-10.zip")
        .replace(/[\\/:*?"<>|]/g, "_")
        .slice(0, 180) || "EasyDesktop-10.zip";

    const url = await getSignedUrl(
      createR2Client(),
      new GetObjectCommand({
        Bucket: getR2BucketName(),
        Key: settings.full_object_key,
        ResponseContentDisposition: `attachment; filename="${safeName}"`,
        ResponseContentType: "application/octet-stream",
      }),
      { expiresIn: 300 }
    );

    return NextResponse.redirect(url, 302);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not create the paid download." },
      { status: 500 }
    );
  }
}
