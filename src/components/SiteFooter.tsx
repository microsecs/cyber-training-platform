"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  const isOutlookAddin =
    pathname === "/outlook-addin" || pathname.startsWith("/outlook-addin/");
  const isGmailConnect =
    pathname === "/gmail-addin/connect" ||
    pathname.startsWith("/gmail-addin/connect/") ||
    pathname === "/gmail-addin/oauth/authorize" ||
    pathname.startsWith("/gmail-addin/oauth/authorize/");
  const isMinimalChrome = isOutlookAddin || isGmailConnect;

  if (isMinimalChrome) {
    return (
      <footer className="mt-auto border-t border-white/10 bg-slate-950/95">
        <div className="mx-auto max-w-7xl px-5 py-4 text-center text-xs text-slate-600">
          © 2026 MicroSECONDS Computer Consulting. All rights reserved.
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-4 text-center text-xs text-slate-400">
        <span>© {new Date().getFullYear()} MicroSECONDS Computer Consulting</span>
        <span aria-hidden="true">·</span>
        <span>MicroSECONDS Training</span>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-sky-400">Terms</Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className="hover:text-sky-400">Privacy</Link>
      </div>
    </footer>
  );
}
