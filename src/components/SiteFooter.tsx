"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SiteFooter() {
  const [easyDesktopUrl, setEasyDesktopUrl] = useState("");

  useEffect(() => {
    fetch("/api/support-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((result) => setEasyDesktopUrl(result?.settings?.easydesktop_url || ""))
      .catch(() => {});
  }, []);

  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/95">
      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="font-semibold text-white">MicroSECONDS</div>
          <div className="mt-1 text-sm text-slate-500">Technology, Security &amp; Software</div>
          <div className="mt-2 text-xs text-slate-600">© 2026 MicroSECONDS Computer Consulting. All rights reserved.</div>
        </div>

        <nav className="grid content-start gap-2 text-sm text-slate-400" aria-label="Services">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Services</div>
          <Link href="/training" className="hover:text-cyan-300">Employee Security Training</Link>
          <Link href="/consulting" className="hover:text-cyan-300">Computer Consulting</Link>
          {easyDesktopUrl ? <a href={easyDesktopUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">EasyDesktop</a> : null}
        </nav>

        <nav className="grid content-start gap-2 text-sm text-slate-400" aria-label="Support">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Support</div>
          <Link href="/support" className="hover:text-cyan-300">Remote Support</Link>
          <a href="mailto:support@microseconds.com" className="hover:text-cyan-300">support@microseconds.com</a>
        </nav>

        <nav className="grid content-start gap-2 text-sm text-slate-400" aria-label="Legal">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</div>
          <Link href="/privacy" className="hover:text-cyan-300">Privacy</Link>
          <Link href="/terms" className="hover:text-cyan-300">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
