"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppRole, defaultPathForRole, resolveUserAccess } from "@/lib/supabase/access";

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
    pathname === "/easydesktop"
  );
}

function isAllowed(pathname: string, role: AppRole) {
  if (isPublicPath(pathname)) return true;
  if (pathname === "/account") return role !== "guest";

  if (pathname === "/platform-admin" || pathname.startsWith("/platform-admin/") || pathname.startsWith("/admin/courses")) {
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (isPublicPath(pathname)) {
        if (!cancelled) setReady(true);
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

      setReady(true);
    }

    setReady(false);
    check();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12 text-slate-400">
        Checking access...
      </main>
    );
  }

  return <>{children}</>;
}
