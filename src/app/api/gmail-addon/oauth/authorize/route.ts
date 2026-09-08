import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  gmailAccessForUser,
  gmailOAuthConfig,
  randomOAuthValue,
  safeEqual,
  sha256,
} from "@/lib/gmailOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || "";
    const accessToken = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

    if (!accessToken) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = await request.json();
    const clientId = String(body?.client_id || "");
    const redirectUri = String(body?.redirect_uri || "");
    const state = String(body?.state || "");

    const config = gmailOAuthConfig();

    if (!safeEqual(clientId, config.clientId) || redirectUri !== config.redirectUri) {
      return NextResponse.json(
        { error: "The Gmail authorization request could not be verified." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    const user = userData.user;

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your MicroSECONDS sign-in expired. Please sign in again." },
        { status: 401 }
      );
    }

    const access = await gmailAccessForUser(user.id);

    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.error,
          message: (access as any).message || undefined,
        },
        { status: (access as any).status || 403 }
      );
    }

    const code = randomOAuthValue(32);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    // Clean up expired codes opportunistically.
    await admin
      .from("gmail_oauth_codes")
      .delete()
      .lt("expires_at", now.toISOString());

    const { error: insertError } = await admin
      .from("gmail_oauth_codes")
      .insert({
        code_hash: sha256(code),
        user_id: user.id,
        company_id: access.companyId || null,
        role: access.role,
        redirect_uri: redirectUri,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Gmail OAuth code insert error", insertError);
      return NextResponse.json(
        { error: "Could not authorize Gmail." },
        { status: 500 }
      );
    }

    const redirect = new URL(redirectUri);
    redirect.searchParams.set("code", code);
    if (state) redirect.searchParams.set("state", state);

    return NextResponse.json({ redirect_url: redirect.toString() });
  } catch (error: any) {
    console.error("Gmail OAuth authorization error", error);
    return NextResponse.json(
      { error: error?.message || "Could not authorize Gmail." },
      { status: 500 }
    );
  }
}
