"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  const isOutlookAddin =
    pathname === "/outlook-addin" || pathname.startsWith("/outlook-addin/");
  const isGmailConnect =
    pathname === "/gmail-addin/connect" || pathname.startsWith("/gmail-addin/connect/");
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
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-semibold text-white">MicroSECONDS</div>
          <div className="mt-1 text-xs text-slate-600">
            © 2026 MicroSECONDS Computer Consulting. All rights reserved.
          </div>
        </div>

        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"
          aria-label="Footer navigation"
        >
          <Link href="/" className="hover:text-cyan-300">Home</Link>
          <Link href="/consulting" className="hover:text-cyan-300">IT Consulting</Link>
          <Link href="/easydesktop" className="hover:text-cyan-300">EasyDesktop</Link>
          <Link href="/terms" className="hover:text-cyan-300">Terms</Link>
          <Link href="/privacy" className="hover:text-cyan-300">Privacy</Link>
          <Link href="/support" className="hover:text-cyan-300">Support</Link>
        </nav>
      </div>
    </footer>
  );
}
