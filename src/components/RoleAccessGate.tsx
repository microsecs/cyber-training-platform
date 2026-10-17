"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppRole, defaultPathForRole, resolveUserAccess } from "@/lib/supabase/access";
import { createClient } from "@/lib/supabase/client";

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/accept-invite" ||
    pathname === "/contact" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/support" ||
    pathname === "/consulting" ||
    pathname === "/monitoring" ||
    pathname === "/employee-security-training" ||
    pathname === "/easydesktop" ||
    pathname === "/gmail-addin/connect" ||
    pathname === "/gmail-addin/oauth/authorize" ||
    pathname === "/outlook-addin" ||
    pathname.startsWith("/outlook-addin/") ||
    pathname.startsWith("/easydesktop/")
  );
}

function isAllowed(pathname: string, role: AppRole) {
  if (isPublicPath(pathname)) return true;
  if (pathname === "/mfa" || pathname === "/mfa/setup") return role !== "guest";
  if (pathname === "/account") return role !== "guest";

  if (
    pathname === "/platform-admin" ||
    pathname.startsWith("/platform-admin/") ||
    pathname.startsWith("/admin/courses")
  ) {
    return role === "platform_admin";
  }

  if (
    pathname === "/admin" ||
    pathname === "/employees" ||
    pathname === "/training" ||
    pathname === "/assign-training" ||
    pathname === "/reports"
  ) {
    return role === "owner" || role === "admin";
  }

  if (pathname === "/employee" || pathname.startsWith("/course/")) {
    return role === "employee";
  }

  return role !== "guest";
}

export default function RoleAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (isPublicPath(pathname)) {
        return;
      }

      const access = await resolveUserAccess();
      if (cancelled) return;

      if (access.role === "guest") {
        router.replace("/login");
        return;
      }

      if (!isAllowed(pathname, access.role)) {
        router.replace(defaultPathForRole(access.role));
        return;
      }

      // MFA is optional to enroll, but once a verified factor exists,
      // require it for the current login session.
      if (pathname !== "/mfa" && pathname !== "/mfa/setup") {
        const supabase = createClient();

        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verifiedFactor = factors?.totp?.find(
          (item: any) => item.status === "verified"
        );

        if (verifiedFactor) {
          const { data: aal } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

          if (aal?.currentLevel !== "aal2") {
            router.replace(`/mfa?returnTo=${encodeURIComponent(pathname)}`);
            return;
          }
        }
      }

    }

    check();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // Always render the same tree during SSR and the browser's first render.
  // Access checks run after hydration and redirect protected routes when needed.
  return <>{children}</>;
}
