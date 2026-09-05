import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (userError || !userData.user) {
    return { error: "Invalid session", status: 401 } as const;
  }

  const { data: adminRow } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!adminRow) {
    return { error: "Platform admin access required", status: 403 } as const;
  }

  return { userId: userData.user.id } as const;
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("easydesktop_settings")
      .select("trial_object_key,trial_file_name,updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      settings: data || {
        trial_object_key: null,
        trial_file_name: null,
        updated_at: null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not load EasyDesktop settings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const objectKey = String(body.trialObjectKey || "").trim();
    const fileName = String(body.trialFileName || "").trim();

    if (!objectKey.startsWith("easydesktop/trial/")) {
      return NextResponse.json(
        { error: "Invalid EasyDesktop trial file." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("easydesktop_settings").upsert(
      {
        id: 1,
        trial_object_key: objectKey,
        trial_file_name: fileName.slice(0, 255) || "EasyDesktop-10-Trial.zip",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not save EasyDesktop settings." },
      { status: 500 }
    );
  }
}
