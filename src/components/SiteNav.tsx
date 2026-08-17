"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SiteNav() {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkPlatformAdmin() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setIsPlatformAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      setIsPlatformAdmin(!!data);
    }

    checkPlatformAdmin();
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/admin", label: "Admin" },
    { href: "/employees", label: "Employees" },
    { href: "/training", label: "Training" },
    { href: "/assign-training", label: "Assign Training" },
    { href: "/reports", label: "Reports" },
    { href: "/employee", label: "Employee View" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group min-w-0 shrink"
          aria-label="MicroSECONDS Training home"
        >
          <Image
            src="/microseconds-logo.png"
            alt="MicroSECONDS"
            width={835}
            height={109}
            priority
            className="h-7 w-auto max-w-[190px] object-contain sm:h-8 sm:max-w-[235px] lg:h-9 lg:max-w-[270px]"
          />
          <div className="mt-1 hidden text-xs font-medium tracking-wide text-slate-400 sm:block lg:text-sm">
            Employee Security Training
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}

          {isPlatformAdmin ? (
            <Link
              href="/platform-admin"
              className="rounded-lg bg-amber-400/10 px-3 py-2 text-amber-300 hover:bg-amber-400/20"
            >
              Platform Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex shrink-0 gap-2">
          <Link
            href="/account"
            className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
          >
            Account
          </Link>

          <Link
            href="/login"
            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
