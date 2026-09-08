import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  gmailAccessForUser,
  issueGmailAddonToken,
} from "@/lib/gmailAddonAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  return { url, key };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Enter your MicroSECONDS email address and password." },
        { status: 400 }
      );
    }

    const { url, key } = supabaseConfig();
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedFactor = factors?.totp?.find(
      (item: any) => item.status === "verified"
    );

    if (verifiedFactor) {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aal?.currentLevel !== "aal2") {
        return NextResponse.json({
          mfa_required: true,
          factor_id: verifiedFactor.id,
          access_token: data.session.access_token,
        });
      }
    }

    const access = await gmailAccessForUser(data.user.id);

    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.error,
          code: (access as any).code || undefined,
          message: (access as any).message || undefined,
          role: (access as any).role || undefined,
        },
        { status: (access as any).status || 403 }
      );
    }

    const token = await issueGmailAddonToken(
      data.user.id,
      access.role,
      access.companyId
    );

    return NextResponse.json({
      token,
      connected: true,
      role: access.role,
    });
  } catch (error: any) {
    console.error("Gmail direct login error", error);
    return NextResponse.json(
      { error: error?.message || "Could not sign in to MicroSECONDS." },
      { status: 500 }
    );
  }
}
