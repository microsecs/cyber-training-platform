import { createClient } from "@/lib/supabase/client";

export type AppRole =
  | "guest"
  | "platform_admin"
  | "owner"
  | "admin"
  | "employee"
  | "authenticated";

export type UserAccess = {
  role: AppRole;
  userId: string | null;
  email: string | null;
  companyId: string | null;
  companyName: string | null;
};

export async function resolveUserAccess(): Promise<UserAccess> {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { role: "guest", userId: null, email: null, companyId: null, companyName: null };
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (platformAdmin) {
    return {
      role: "platform_admin",
      userId: user.id,
      email: user.email ?? null,
      companyId: null,
      companyName: null,
    };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id,role,is_active,companies(name)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membership) {
    const company: any = Array.isArray(membership.companies)
      ? membership.companies[0]
      : membership.companies;

    const role: AppRole =
      membership.role === "owner"
        ? "owner"
        : membership.role === "admin"
        ? "admin"
        : "employee";

    return {
      role,
      userId: user.id,
      email: user.email ?? null,
      companyId: membership.company_id,
      companyName: company?.name ?? null,
    };
  }

  return {
    role: "authenticated",
    userId: user.id,
    email: user.email ?? null,
    companyId: null,
    companyName: null,
  };
}

export function defaultPathForRole(role: AppRole) {
  if (role === "platform_admin") return "/platform-admin";
  if (role === "owner" || role === "admin") return "/admin";
  if (role === "employee") return "/employee";
  if (role === "authenticated") return "/account";
  return "/login";
}
