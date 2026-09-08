"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppRole, resolveUserAccess } from "@/lib/supabase/access";

export default function SiteNav() {
  const pathname = usePathname();
  const isGmailConnect =
    pathname === "/gmail-addin/connect" ||
    pathname.startsWith("/gmail-addin/connect/") ||
    pathname === "/gmail-addin/oauth/authorize" ||
    pathname.startsWith("/gmail-addin/oauth/authorize/");
  const isOutlookAddin = pathname === "/outlook-addin" || pathname.startsWith("/outlook-addin/");
  const isMinimalChrome = isGmailConnect || isOutlookAddin;
  const [role, setRole] = useState<AppRole>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function refreshAccess() {
      const access = await resolveUserAccess();
      setRole(access.role);
      setLoading(false);
    }

    refreshAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshAccess();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = isOutlookAddin ? "/outlook-addin" : "/login";
  }

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/consulting", label: "IT Consulting" },
    { href: "/easydesktop", label: "EasyDesktop" },
    { href: "/support", label: "Support" },
  ];

  const roleLinks =
    role === "owner" || role === "admin"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/employees", label: "Employees" },
          { href: "/training", label: "Training" },
          { href: "/assign-training", label: "Assign Training" },
          { href: "/reports", label: "Reports" },
          { href: "/phishing-check", label: "Email Analyzer" },
        ]
      : role === "employee"
      ? [
          { href: "/employee", label: "My Training" },
          { href: "/phishing-check", label: "Email Analyzer" },
        ]
      : role === "platform_admin"
      ? [
          { href: "/platform-admin", label: "Platform Admin" },
          { href: "/phishing-check", label: "Email Analyzer" },
        ]
      : [];

  const links =
    role === "guest"
      ? publicLinks
      : [...roleLinks, { href: "/support", label: "Support" }];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group min-w-0 shrink" aria-label="MicroSECONDS Training home">
          <Image
            src="/microseconds-logo.png"
            alt="MicroSECONDS"
            width={835}
            height={109}
            priority
            className="h-7 w-auto max-w-[150px] object-contain sm:h-8 sm:max-w-[210px] lg:h-8 lg:max-w-[220px] xl:h-9 xl:max-w-[240px]"
          />
          <div className="mt-1 hidden text-xs font-medium tracking-wide text-slate-400 sm:block lg:text-sm">
            Employee Security Training
          </div>
        </Link>

        {!isMinimalChrome && !loading ? (
          <nav className="hidden min-w-0 items-center gap-3 whitespace-nowrap text-xs text-slate-300 lg:flex xl:gap-4 xl:text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.href === "/platform-admin"
                    ? "rounded-lg bg-amber-400/10 px-3 py-2 text-amber-300 hover:bg-amber-400/20"
                    : "hover:text-cyan-300"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          {!loading && role !== "guest" ? (
            <>
              {!isMinimalChrome ? (
                <Link
                  href="/account"
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
                >
                  Account
                </Link>
              ) : null}

              <button
                type="button"
                onClick={signOut}
                className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Sign Out
              </button>
            </>
          ) : null}

          {!loading && role === "guest" ? (
            <Link
              href={isOutlookAddin ? "/login?next=/outlook-addin" : "/login"}
              className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Sign In
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
