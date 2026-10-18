import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const recent = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max + 1) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });
    const name = text(body.name, 120);
    const email = text(body.email, 254);
    const subject = text(body.subject, 180);
    const message = text(body.message, 5000);
    if (!name || !email || !subject || !message ||
        name.length > 120 || email.length > 254 || subject.length > 180 ||
        message.length > 5000 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please complete all fields with a valid email address." }, { status: 400 });
    }

    // Best-effort per-instance throttling. For heavy public traffic, use a
    // shared rate limiter or CAPTCHA because serverless instances do not share memory.
    const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const now = Date.now();
    const times = (recent.get(ip) || []).filter((time) => now - time < WINDOW_MS);
    if (times.length >= LIMIT) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    times.push(now);
    recent.set(ip, times);
    if (recent.size > 1000) {
      for (const [key, entries] of recent) {
        if (entries.every((time) => now - time >= WINDOW_MS)) recent.delete(key);
      }
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error("Support request email configuration missing");
      return NextResponse.json({ error: "Support email is temporarily unavailable." }, { status: 503 });
    }
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: "support@microseconds.com",
      replyTo: email,
      subject: `[MicroSECONDS Training Support] ${subject.replace(/[\\r\\n]/g, " ")}`,
      text: `MicroSECONDS Training support request\\n\\nName: ${name}\\nEmail: ${email}\\nSubject: ${subject}\\nSubmitted: ${new Date().toISOString()}\\n\\nMessage:\\n${message}`,
    });
    if (error) {
      console.error("Support request delivery failed", error);
      return NextResponse.json({ error: "Unable to send your request right now. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Support request error", error);
    return NextResponse.json({ error: "Unable to process your request." }, { status: 500 });
  }
}
