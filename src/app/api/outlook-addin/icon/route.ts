import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = new Set(["16", "32", "64", "80", "128"]);

export async function GET(request: NextRequest) {
  try {
    const size = request.nextUrl.searchParams.get("size") || "32";

    if (!allowed.has(size)) {
      return NextResponse.json({ error: "Invalid icon size." }, { status: 400 });
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "outlook-addin",
      `microseconds-m-v3-${size}.png`
    );

    const image = await readFile(filePath);

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (error) {
    console.error("Outlook icon route error", error);
    return NextResponse.json({ error: "Icon unavailable." }, { status: 500 });
  }
}
