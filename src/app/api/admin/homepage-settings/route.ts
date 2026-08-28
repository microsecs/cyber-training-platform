import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";
import { DEFAULT_HOMEPAGE_SETTINGS, HomepageStat } from "@/lib/homepage-config";

async function requirePlatformAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { error: "Not authenticated", status: 401 } as const;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { error: "Invalid session", status: 401 } as const;

  const { data: adminRow, error: adminError } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError) return { error: adminError.message, status: 500 } as const;
  if (!adminRow) return { error: "Platform admin access required", status: 403 } as const;

  return { userId: userData.user.id } as const;
}

function cleanStats(stats: unknown): HomepageStat[] {
  if (!Array.isArray(stats)) return DEFAULT_HOMEPAGE_SETTINGS.stats;

  return stats.slice(0, 12).map((stat: any, index) => ({
    id: String(stat?.id || `stat-${Date.now()}-${index}`),
    value: String(stat?.value || "").trim().slice(0, 80),
    label: String(stat?.label || "").trim().slice(0, 240),
    detail: String(stat?.detail || "").trim().slice(0, 500),
    source: String(stat?.source || "").trim().slice(0, 160),
    sourceDate: String(stat?.sourceDate || "").trim().slice(0, 80),
    sourceUrl: String(stat?.sourceUrl || "").trim().slice(0, 1000),
    enabled: stat?.enabled !== false,
  }));
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("homepage_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      settings: data || null,
      defaults: DEFAULT_HOMEPAGE_SETTINGS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not load homepage settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const admin = createAdminClient();

    const { data: current, error: currentError } = await admin
      .from("homepage_settings")
      .select("video_key")
      .eq("id", 1)
      .maybeSingle();

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 });

    const newVideoKey = body.videoKey ? String(body.videoKey) : null;
    const oldVideoKey = current?.video_key ? String(current.video_key) : null;

    const row = {
      id: 1,
      hero_badge: String(body.heroBadge || "").trim().slice(0, 160),
      hero_title: String(body.heroTitle || "").trim().slice(0, 300),
      hero_body: String(body.heroBody || "").trim().slice(0, 1200),
      video_key: newVideoKey,
      video_url: body.videoUrl ? String(body.videoUrl).trim().slice(0, 2000) : null,
      video_title: String(body.videoTitle || "").trim().slice(0, 240),
      stats_eyebrow: String(body.statsEyebrow || "").trim().slice(0, 160),
      stats_heading: String(body.statsHeading || "").trim().slice(0, 400),
      stats_body: String(body.statsBody || "").trim().slice(0, 1200),
      stats: cleanStats(body.stats),
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await admin.from("homepage_settings").upsert(row, { onConflict: "id" });
    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

    if (oldVideoKey && oldVideoKey !== newVideoKey) {
      try {
        await createR2Client().send(
          new DeleteObjectCommand({ Bucket: getR2BucketName(), Key: oldVideoKey })
        );
      } catch (cleanupError) {
        console.warn("Could not remove previous homepage video:", cleanupError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not save homepage settings" }, { status: 500 });
  }
}
