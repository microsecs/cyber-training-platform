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
    const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <style>:root { color-scheme: dark; supported-color-schemes: dark; }</style>
</head>
<body style="margin:0;padding:0;background-color:#080f1f;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#080f1f" style="width:100%;background-color:#080f1f;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" bgcolor="#111a2b" style="width:100%;max-width:600px;background-color:#111a2b;border:1px solid #2b3951;border-collapse:separate;border-spacing:0;">
        <tr><td bgcolor="#101827" style="background-color:#101827;padding:24px 28px;border-bottom:3px solid #22d3ee;">
          <div style="font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">MicroSECONDS</div>
          <div style="font-size:12px;line-height:20px;font-weight:700;letter-spacing:3px;color:#67e8f9;">TRAINING SUPPORT</div>
        </td></tr>
        <tr><td bgcolor="#111a2b" style="background-color:#111a2b;padding:26px 28px;color:#f8fafc;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;">NEW SUPPORT REQUEST</div>
          <h1 style="font-size:23px;line-height:30px;font-weight:700;margin:12px 0 22px;color:#ffffff;">${safeSubject}</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#172338" style="width:100%;background-color:#172338;border-collapse:collapse;">
            <tr>
              <td bgcolor="#172338" style="width:96px;padding:12px;color:#a9bbd3;font-size:13px;border-bottom:1px solid #334155;">Name</td>
              <td bgcolor="#172338" style="padding:12px;color:#ffffff;font-size:14px;border-bottom:1px solid #334155;">${safeName}</td>
            </tr>
            <tr>
              <td bgcolor="#172338" style="padding:12px;color:#a9bbd3;font-size:13px;border-bottom:1px solid #334155;">Email</td>
              <td bgcolor="#172338" style="padding:12px;color:#ffffff;font-size:14px;border-bottom:1px solid #334155;word-break:break-word;"><a href="mailto:${safeEmail}" style="color:#67e8f9;text-decoration:underline;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td bgcolor="#172338" style="padding:12px;color:#a9bbd3;font-size:13px;">Submitted</td>
              <td bgcolor="#172338" style="padding:12px;color:#ffffff;font-size:14px;">${escapeHtml(submittedAt)}</td>
            </tr>
          </table>
          <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#93c5fd;margin:26px 0 10px;">MESSAGE</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#172338" style="width:100%;background-color:#172338;border:1px solid #334155;">
            <tr><td bgcolor="#172338" style="padding:18px;color:#ffffff;font-size:15px;line-height:24px;word-break:break-word;">${safeMessage}</td></tr>
          </table>
        </td></tr>
        <tr><td bgcolor="#101827" style="background-color:#101827;padding:16px 28px;border-top:1px solid #334155;color:#a9bbd3;font-size:12px;line-height:18px;">MicroSECONDS Computer Consulting &middot; Employee Security Training</td></tr>
      </table>
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
