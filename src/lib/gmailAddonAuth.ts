import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function hashGmailToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
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
    const isOwner = role === "owner" || role === "admin";

    return {
      ok: false as const,
      status: 403,
      code: "subscription_required",
      role,
      error: "MicroSECONDS Subscription Required",
      message: isOwner
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

export async function issueGmailAddonToken(
  userId: string,
  role: string,
  companyId?: string | null
) {
  const admin = createAdminClient();
  const token = randomBytes(32).toString("base64url");

  // Keep only a small number of active Gmail connections per user.
  // Old tokens are revoked rather than deleted for auditability.
  const { data: existing } = await admin
    .from("gmail_addon_connections")
    .select("id,created_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if ((existing || []).length >= 5) {
    const revokeIds = (existing || []).slice(4).map((row: any) => row.id);
    if (revokeIds.length) {
      await admin
        .from("gmail_addon_connections")
        .update({ revoked_at: new Date().toISOString() })
        .in("id", revokeIds);
    }
  }

  const { error } = await admin.from("gmail_addon_connections").insert({
    token_hash: hashGmailToken(token),
    user_id: userId,
    company_id: companyId || null,
    role,
    label: "Gmail Add-on",
  });

  if (error) {
    console.error("Gmail connection insert error", error);
    throw new Error("Could not connect Gmail.");
  }

  return token;
}
