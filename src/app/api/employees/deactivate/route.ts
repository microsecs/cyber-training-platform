import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { membershipId } = await request.json();
    const admin = createAdminClient();

    const { data: target } = await admin
      .from("memberships")
      .select("id,user_id,company_id,role,is_active")
      .eq("id", membershipId)
      .single();

    if (!target || target.role !== "employee") {
      return NextResponse.json({ error: "Employee membership not found" }, { status: 404 });
    }

    const { data: requester } = await admin
      .from("memberships")
      .select("role")
      .eq("company_id", target.company_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (!requester) {
      return NextResponse.json({ error: "Company admin access required" }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from("memberships")
      .update({ is_active: false })
      .eq("id", target.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Stop automatic emails for unfinished assignments, but preserve the records.
    await admin
      .from("assignments")
      .update({ reminders_enabled: false })
      .eq("company_id", target.company_id)
      .eq("user_id", target.user_id)
      .neq("status", "completed");

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not deactivate employee" },
      { status: 500 }
    );
  }
}
