import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  gmailOAuthConfig,
  randomOAuthValue,
  safeEqual,
  sha256,
} from "@/lib/gmailOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function oauthError(error: string, description: string, status = 400) {
  return NextResponse.json(
    { error, error_description: description },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const form = new URLSearchParams(raw);

    const grantType = String(form.get("grant_type") || "");
    const code = String(form.get("code") || "");
    const clientId = String(form.get("client_id") || "");
    const clientSecret = String(form.get("client_secret") || "");
    const redirectUri = String(form.get("redirect_uri") || "");

    if (grantType !== "authorization_code") {
      return oauthError("unsupported_grant_type", "Only authorization_code is supported.");
    }

    if (!code) {
      return oauthError("invalid_grant", "Missing authorization code.");
    }

    const config = gmailOAuthConfig();

    if (
      !safeEqual(clientId, config.clientId) ||
      !safeEqual(clientSecret, config.clientSecret)
    ) {
      return oauthError("invalid_client", "Invalid Gmail add-on client credentials.", 401);
    }

    if (redirectUri !== config.redirectUri) {
      return oauthError("invalid_grant", "Redirect URI does not match.");
    }

    const admin = createAdminClient();
    const codeHash = sha256(code);

    const { data: row, error: lookupError } = await admin
      .from("gmail_oauth_codes")
      .select("id,user_id,company_id,role,redirect_uri,expires_at,used_at")
      .eq("code_hash", codeHash)
      .maybeSingle();

    if (lookupError || !row) {
      return oauthError("invalid_grant", "Authorization code is invalid.");
    }

    if (row.used_at) {
      return oauthError("invalid_grant", "Authorization code was already used.");
    }

    if (row.redirect_uri !== redirectUri) {
      return oauthError("invalid_grant", "Redirect URI does not match.");
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      return oauthError("invalid_grant", "Authorization code expired.");
    }

    // Consume the one-time code before issuing the connection token.
    const { error: consumeError } = await admin
      .from("gmail_oauth_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("used_at", null);

    if (consumeError) {
      return oauthError("invalid_grant", "Authorization code could not be consumed.");
    }

    const token = randomOAuthValue(32);

    const { error: tokenError } = await admin
      .from("gmail_addon_connections")
      .insert({
        token_hash: sha256(token),
        user_id: row.user_id,
        company_id: row.company_id,
        role: row.role,
        label: "Gmail Add-on OAuth",
      });

    if (tokenError) {
      console.error("Gmail OAuth token insert error", tokenError);
      return oauthError("server_error", "Could not create Gmail connection.", 500);
    }

    return NextResponse.json(
      {
        access_token: token,
        token_type: "Bearer",
        expires_in: 31536000,
        scope: "gmail_analyzer",
      },
      {
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("Gmail OAuth token error", error);
    return oauthError("server_error", error?.message || "Token exchange failed.", 500);
  }
}
