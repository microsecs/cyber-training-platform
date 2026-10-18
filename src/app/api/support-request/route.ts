import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const recent = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 5;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max + 1) : "";
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
        message.length > 5000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "long",
      timeStyle: "short",
    }) + " Pacific";
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\\r?\\n/g, "<br />");
    // Keep colors and backgrounds at the email client's defaults so light/dark
    // appearance follows the recipient's own mail application settings.
    const html = `
<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;border-collapse:collapse;">
    <tr><td style="padding:12px 0 18px;border-bottom:1px solid #999999;">
      <strong style="font-size:22px;">MicroSECONDS</strong><br />
      <span style="font-size:12px;letter-spacing:2px;">TRAINING SUPPORT</span>
    </td></tr>
    <tr><td style="padding:20px 0 8px;">
      <div style="font-size:12px;font-weight:bold;">NEW SUPPORT REQUEST</div>
      <h2 style="margin:8px 0 18px;font-size:20px;">${safeSubject}</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr><td style="padding:7px 12px 7px 0;width:95px;vertical-align:top;"><strong>Name</strong></td><td style="padding:7px 0;">${safeName}</td></tr>
        <tr><td style="padding:7px 12px 7px 0;vertical-align:top;"><strong>Email</strong></td><td style="padding:7px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
        <tr><td style="padding:7px 12px 7px 0;vertical-align:top;"><strong>Submitted</strong></td><td style="padding:7px 0;">${escapeHtml(submittedAt)}</td></tr>
      </table>
      <h3 style="font-size:14px;margin:24px 0 8px;">Message</h3>
      <div style="padding:12px 0;border-top:1px solid #999999;overflow-wrap:anywhere;">${safeMessage}</div>
    </td></tr>
    <tr><td style="padding:14px 0;border-top:1px solid #999999;font-size:12px;">
      MicroSECONDS Computer Consulting &middot; Employee Security Training
    </td></tr>
  </table>
</body>
</html>`;
    const plainText = [
      "MicroSECONDS Training — New support request",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      `Submitted: ${submittedAt}`,
      "",
      "Message:",
      message,
    ].join("\\n");
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: "support@microseconds.com",
      replyTo: email,
      subject: `[MicroSECONDS Training Support] ${subject.replace(/[\\r\\n]/g, " ")}`,
      html,
      text: plainText,
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
