import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomOAuthValue(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function gmailOAuthConfig() {
  const clientId = String(process.env.GMAIL_ADDON_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GMAIL_ADDON_OAUTH_CLIENT_SECRET || "").trim();
  const redirectUri = String(process.env.GMAIL_ADDON_OAUTH_REDIRECT_URI || "").trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Gmail OAuth is not fully configured.");
  }

  return { clientId, clientSecret, redirectUri };
}

export async function gmailAccessForUser(userId: string) {
  const admin = createAdminClient();

  const { data: platformAdmin } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (platformAdmin) {
    return {
      ok: true as const,
      role: "platform_admin",
      companyId: null as string | null,
    };
  }

  const { data: membership } = await admin
    .from("memberships")
    .select("role,is_active,company_id,companies(subscription_status,billing_exempt)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return {
      ok: false as const,
      status: 403,
      error: "No active MicroSECONDS company membership was found for this account.",
    };
  }

  const company: any = Array.isArray((membership as any).companies)
    ? (membership as any).companies[0]
    : (membership as any).companies;

  const role = String((membership as any).role || "employee");

  const active =
    company?.billing_exempt === true ||
    company?.subscription_status === "active" ||
    company?.subscription_status === "trialing";

  if (!active) {
    const owner = role === "owner" || role === "admin";

    return {
      ok: false as const,
      status: 403,
      error: "MicroSECONDS Subscription Required",
      message: owner
        ? "Your organization's MicroSECONDS subscription is not active. Reactivate the subscription to use Email Risk Analyzer in Gmail."
        : "Your organization's MicroSECONDS subscription is not active. Please contact your organization's MicroSECONDS administrator.",
    };
  }

  return {
    ok: true as const,
    role,
    companyId: String((membership as any).company_id || ""),
  };
}
