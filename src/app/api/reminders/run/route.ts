import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const day = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const plus3 = new Date(now);
    plus3.setUTCDate(now.getUTCDate() + 3);

    const today = day(now);
    const soon = day(plus3);

    const { data: list, error } = await db
      .from("assignments")
      .select("id,user_id,status,due_date,reminders_enabled,courses(title),companies(name)")
      .neq("status", "completed")
      .eq("reminders_enabled", true)
      .not("due_date", "is", null)
      .lte("due_date", soon);

    if (error) throw error;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    let sent = 0;
    let skipped = 0;

    for (const assignment of list || []) {
      let reminderType: "due_soon" | "due_today" | "overdue" | null = null;

      if (assignment.due_date === soon) reminderType = "due_soon";
      else if (assignment.due_date === today) reminderType = "due_today";
      else if (assignment.due_date < today) reminderType = "overdue";

      if (!reminderType) {
        skipped++;
        continue;
      }

      const { data: alreadySent } = await db
        .from("training_reminders")
        .select("id")
        .eq("assignment_id", assignment.id)
        .eq("reminder_type", reminderType)
        .maybeSingle();

      if (alreadySent) {
        skipped++;
        continue;
      }

      const { data: profile } = await db
        .from("profiles")
        .select("email,full_name")
        .eq("id", assignment.user_id)
        .single();

      if (!profile?.email) {
        skipped++;
        continue;
      }

      const course: any = Array.isArray(assignment.courses)
        ? assignment.courses[0]
        : assignment.courses;

      const company: any = Array.isArray(assignment.companies)
        ? assignment.companies[0]
        : assignment.companies;

      const label =
        reminderType === "overdue"
          ? "Training Overdue"
          : reminderType === "due_today"
          ? "Training Due Today"
          : "Training Due in 3 Days";

      const { error: mailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: profile.email,
        subject: `${label}: ${course?.title || "Cybersecurity Training"}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>${label}</h2>
            <p>Hello ${profile.full_name || "there"},</p>
            <p>${company?.name || "Your company"} assigned you <strong>${course?.title || "cybersecurity training"}</strong>.</p>
            <p><strong>Due:</strong> ${new Date(assignment.due_date + "T00:00:00").toLocaleDateString("en-US")}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/employee">Complete Training</a></p>
          </div>
        `,
      });

      if (mailError) {
        skipped++;
        continue;
      }

      await db.from("training_reminders").insert({
        assignment_id: assignment.id,
        reminder_type: reminderType,
        sent_to: profile.email,
      });

      sent++;
    }

    return NextResponse.json({ ok: true, sent, skipped });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Reminder run failed" },
      { status: 500 }
    );
  }
}
