import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const FROM_EMAIL = "MicroSECONDS Training <training@microseconds.com>";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
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
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { courseId, userIds, dueDate, quizRequired, remindersEnabled } = await req.json();

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("company_id,role,companies(name)")
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { data: courseRow, error: courseError } = await supabase
      .from("courses")
      .select("id,title")
      .eq("id", courseId)
      .single();

    if (courseError || !courseRow) {
      return NextResponse.json({ error: "Training course not found" }, { status: 404 });
    }

    const { data: existingActive, error: existingError } = await supabase
      .from("assignments")
      .select("user_id,status")
      .eq("company_id", membership.company_id)
      .eq("course_id", courseId)
      .in("user_id", userIds)
      .neq("status", "completed");

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 });
    }

    const activeUserIds = new Set((existingActive ?? []).map((row) => row.user_id));
    const assignableUserIds = userIds.filter((id: string) => !activeUserIds.has(id));

    if (!assignableUserIds.length) {
      return NextResponse.json(
        { error: "Each selected employee already has an active assignment for this course." },
        { status: 409 }
      );
    }

    const effectiveRemindersEnabled = Boolean(dueDate) && remindersEnabled !== false;

    const rows = assignableUserIds.map((userId: string) => ({
      company_id: membership.company_id,
      course_id: courseId,
      user_id: userId,
      due_date: dueDate || null,
      assigned_by: userData.user!.id,
      status: "not_started",
      quiz_required: quizRequired !== false,
      reminders_enabled: effectiveRemindersEnabled,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("assignments")
      .insert(rows)
      .select("id,user_id");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Assignments were created, but the server is missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", assignableUserIds);

    const resend = new Resend(apiKey);
    const companyRow: any = Array.isArray(membership.companies)
      ? membership.companies[0]
      : membership.companies;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://cyber-training-platform-seven.vercel.app";

    let emailsSent = 0;
    let emailFailures = 0;

    for (const profile of profiles ?? []) {
      if (!profile.email) {
        emailFailures++;
        continue;
      }

      const dueText = dueDate
        ? new Date(dueDate + "T00:00:00").toLocaleDateString("en-US")
        : "No due date";

      const { error: emailError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: profile.email,
        subject: `New Training Assigned: ${courseRow.title}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
            <div style="font-size:13px;font-weight:bold;letter-spacing:.08em;color:#0891b2;text-transform:uppercase">MicroSECONDS Training</div>
            <h1 style="font-size:28px;line-height:1.2;margin:10px 0 18px">New training has been assigned</h1>
            <p>Hello ${profile.full_name || "there"},</p>
            <p>${companyRow?.name || "Your company"} has assigned you <strong>${courseRow.title}</strong>.</p>
            <p><strong>Due date:</strong> ${dueText}</p>
            <p><strong>Quiz:</strong> ${quizRequired !== false ? "Required" : "Not required"}</p>
            <p><strong>Automatic reminders:</strong> ${effectiveRemindersEnabled ? "Enabled" : "Off"}</p>
            <p style="margin:28px 0">
              <a href="${appUrl}/employee" style="display:inline-block;background:#22d3ee;color:#082f49;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold">Start Training</a>
            </p>
            <p style="font-size:13px;color:#64748b">MicroSECONDS Training<br/>Cybersecurity Awareness Training</p>
          </div>
        `,
      });

      if (emailError) emailFailures++;
      else emailsSent++;
    }

    return NextResponse.json({
      ok: true,
      count: inserted?.length ?? 0,
      skippedActive: userIds.length - assignableUserIds.length,
      remindersEnabled: effectiveRemindersEnabled,
      emailsSent,
      emailFailures,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not assign training" },
      { status: 500 }
    );
  }
}
