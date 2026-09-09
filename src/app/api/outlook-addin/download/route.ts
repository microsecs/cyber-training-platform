import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("platform-files")
      .download("outlook/microseconds-email-analyzer-outlook.xml");
    if (!error && data) {
      return new NextResponse(await data.arrayBuffer(), {
        headers: {
          "Content-Type": "application/xml",
          "Content-Disposition": 'attachment; filename="microseconds-email-analyzer-outlook.xml"',
          "Cache-Control": "no-store",
        },
      });
    }
  } catch {}
  const fallback = await fs.readFile(path.join(process.cwd(), "public", "microseconds-email-analyzer-outlook.xml"));
  return new NextResponse(fallback, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": 'attachment; filename="microseconds-email-analyzer-outlook.xml"',
      "Cache-Control": "no-store",
    },
  });
}
