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
      <div style="margin:0;padding:32px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ee;border-radius:12px;overflow:hidden">
          <div style="background:#0f172a;padding:24px 30px;border-bottom:4px solid #22d3ee">
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:.3px">MicroSECONDS</div>
            <div style="color:#67e8f9;font-size:12px;font-weight:700;letter-spacing:3px;margin-top:4px">TRAINING SUPPORT</div>
          </div>
          <div style="padding:28px 30px">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:700">New support request</div>
            <h1 style="font-size:23px;line-height:1.35;margin:10px 0 22px;color:#0f172a">${safeSubject}</h1>
            <table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">
              <tr><td style="padding:10px 12px;background:#f8fafc;width:105px;color:#64748b;border-bottom:1px solid #e2e8f0">Name</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${safeName}</td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;color:#64748b;border-bottom:1px solid #e2e8f0">Email</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0"><a href="mailto:${safeEmail}" style="color:#0369a1">${safeEmail}</a></td></tr>
              <tr><td style="padding:10px 12px;background:#f8fafc;color:#64748b">Submitted</td><td style="padding:10px 12px">${escapeHtml(submittedAt)}</td></tr>
            </table>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-top:28px;margin-bottom:10px">Message</div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;line-height:1.65;font-size:15px;overflow-wrap:anywhere">${safeMessage}</div>
            <p style="font-size:13px;color:#64748b;margin:22px 0 0">Reply to this email to respond directly to the requester.</p>
          </div>
          <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 30px;color:#64748b;font-size:12px">MicroSECONDS Computer Consulting · Employee Security Training</div>
        </div>
      </div>`;
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
