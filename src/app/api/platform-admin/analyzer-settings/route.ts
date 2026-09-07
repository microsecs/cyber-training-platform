"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

async function requirePlatformAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const authClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await authClient.auth.getUser(token);
  const user = data.user;
  if (!user) return null;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return row ? user : null;
}

async function getUsageSummary() {
  const admin = createAdminClient();
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const month = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count: todayCount } = await admin
    .from("email_analyzer_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  const { count: monthCount } = await admin
    .from("email_analyzer_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", month.toISOString());

  const { data: recent } = await admin
    .from("email_analyzer_usage")
    .select("company_id")
    .not("company_id", "is", null)
    .gte("created_at", month.toISOString())
    .limit(10000);

  const counts = new Map<string, number>();
  for (const row of recent || []) {
    const id = String((row as any).company_id || "");
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }

  const ids = Array.from(counts.keys());
  let names = new Map<string, string>();

  if (ids.length) {
    const { data: companies } = await admin
      .from("companies")
      .select("id,name")
      .in("id", ids);

    names = new Map(
      (companies || []).map((c: any) => [String(c.id), String(c.name || "Company")])
    );
  }

  const byCompany = ids
    .map((id) => ({
      company_id: id,
      company_name: names.get(id) || "Unknown company",
      count: counts.get(id) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  return {
    today: todayCount || 0,
    month: monthCount || 0,
    by_company: byCompany,
  };
}

export async function GET(request: NextRequest) {
  const user = await requirePlatformAdmin(request);
  if (!user) return NextResponse.json({ error: "Platform Admin required." }, { status: 403 });

  const admin = createAdminClient();
  const { data: settings, error } = await admin
    .from("email_analyzer_settings")
    .select("limits_enabled,company_daily_limit,user_hourly_limit")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not load analyzer settings. Run the included SQL patch first." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    settings: settings || {
      limits_enabled: true,
      company_daily_limit: 100,
      user_hourly_limit: 20,
    },
    usage: await getUsageSummary(),
  });
}

export async function POST(request: NextRequest) {
  const user = await requirePlatformAdmin(request);
  if (!user) return NextResponse.json({ error: "Platform Admin required." }, { status: 403 });

  const body = await request.json();
  const limitsEnabled = body?.limitsEnabled !== false;
  const companyDailyLimit = Math.max(1, Math.min(100000, Number(body?.companyDailyLimit) || 100));
  const userHourlyLimit = Math.max(1, Math.min(10000, Number(body?.userHourlyLimit) || 20));

  const admin = createAdminClient();
  const { error } = await admin
    .from("email_analyzer_settings")
    .upsert({
      id: 1,
      limits_enabled: limitsEnabled,
      company_daily_limit: companyDailyLimit,
      user_hourly_limit: userHourlyLimit,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: "Could not save analyzer settings." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
