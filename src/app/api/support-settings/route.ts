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

function cleanUrl(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("support_settings")
      .select("support_email,remote_pc_support_url,remote_mac_support_url,easydesktop_url")
      .eq("id", 1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      settings: data || {
        support_email: "support@microseconds.com",
        remote_pc_support_url: null,
        remote_mac_support_url: null,
        easydesktop_url: null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not load support settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const supportEmail = String(body.supportEmail || "support@microseconds.com").trim().toLowerCase();
    const pcRaw = String(body.remotePcSupportUrl || "").trim();
    const macRaw = String(body.remoteMacSupportUrl || "").trim();
    const easyRaw = String(body.easyDesktopUrl || "").trim();
    const pcUrl = cleanUrl(pcRaw);
    const macUrl = cleanUrl(macRaw);
    const easyUrl = cleanUrl(easyRaw);

    if (!supportEmail || !supportEmail.includes("@")) {
      return NextResponse.json({ error: "Enter a valid support email address." }, { status: 400 });
    }
    if (pcRaw && !pcUrl) {
      return NextResponse.json({ error: "Remote PC Support URL must begin with http:// or https://." }, { status: 400 });
    }
    if (macRaw && !macUrl) {
      return NextResponse.json({ error: "Remote Mac Support URL must begin with http:// or https://." }, { status: 400 });
    }
    if (easyRaw && !easyUrl) {
      return NextResponse.json({ error: "EasyDesktop URL must begin with http:// or https://." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("support_settings").upsert(
      {
        id: 1,
        support_email: supportEmail.slice(0, 320),
        remote_pc_support_url: pcUrl,
        remote_mac_support_url: macUrl,
        easydesktop_url: easyUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not save support settings" },
      { status: 500 }
    );
  }
}
