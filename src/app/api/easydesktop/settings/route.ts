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
      .select("trial_object_key,trial_file_name,full_object_key,full_file_name,stripe_price_id,updated_at")
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
        full_object_key: null,
        full_file_name: null,
        stripe_price_id: null,
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
    const admin = createAdminClient();

    const update: Record<string, any> = {
      id: 1,
      updated_at: new Date().toISOString(),
    };

    if ("trialObjectKey" in body) {
      const objectKey = String(body.trialObjectKey || "").trim();
      const fileName = String(body.trialFileName || "").trim();

      if (!objectKey.startsWith("easydesktop/trial/")) {
        return NextResponse.json(
          { error: "Invalid EasyDesktop trial file." },
          { status: 400 }
        );
      }

      update.trial_object_key = objectKey;
      update.trial_file_name =
        fileName.slice(0, 255) || "EasyDesktop-10-Trial.zip";
    }

    if ("fullObjectKey" in body) {
      const objectKey = String(body.fullObjectKey || "").trim();
      const fileName = String(body.fullFileName || "").trim();

      if (!objectKey.startsWith("easydesktop/full/")) {
        return NextResponse.json(
          { error: "Invalid EasyDesktop full-version file." },
          { status: 400 }
        );
      }

      update.full_object_key = objectKey;
      update.full_file_name =
        fileName.slice(0, 255) || "EasyDesktop-10.zip";
    }

    if ("stripePriceId" in body) {
      const priceId = String(body.stripePriceId || "").trim();
      if (priceId && !priceId.startsWith("price_")) {
        return NextResponse.json(
          { error: "Stripe Price ID must start with price_." },
          { status: 400 }
        );
      }
      update.stripe_price_id = priceId || null;
    }

    const { error } = await admin.from("easydesktop_settings").upsert(
      update,
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
