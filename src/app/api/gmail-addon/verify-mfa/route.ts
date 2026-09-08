import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  gmailAccessForUser,
  issueGmailAddonToken,
} from "@/lib/gmailAddonAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = String(body?.access_token || "").trim();
    const factorId = String(body?.factor_id || "").trim();
    const code = String(body?.code || "").replace(/\D/g, "").slice(0, 6);

    if (!accessToken || !factorId || code.length !== 6) {
      return NextResponse.json(
        { error: "Enter the 6-digit authenticator code." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData } = await supabase.auth.getUser(accessToken);
    const user = userData.user;

    if (!user) {
      return NextResponse.json(
        { error: "Your sign-in session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError || !challenge?.id) {
      return NextResponse.json(
        { error: challengeError?.message || "Could not start MFA verification." },
        { status: 400 }
      );
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: "That authenticator code was not accepted." },
        { status: 401 }
      );
    }

    const access = await gmailAccessForUser(user.id);

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
      user.id,
      access.role,
      access.companyId
    );

    return NextResponse.json({
      token,
      connected: true,
      role: access.role,
    });
  } catch (error: any) {
    console.error("Gmail MFA verification error", error);
    return NextResponse.json(
      { error: error?.message || "Could not verify MFA." },
      { status: 500 }
    );
  }
}
