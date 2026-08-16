import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/admin", label: "Admin" },
  { href: "/employees", label: "Employees" },
  { href: "/training", label: "Training" },
  { href: "/assign-training", label: "Assign Training" },
  { href: "/reports", label: "Reports" },
  { href: "/employee", label: "Employee View" },
];

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group">
          <div className="text-lg font-bold tracking-tight group-hover:text-cyan-300">
            CyberAware
          </div>
          <div className="text-[11px] text-slate-500">
            Employee Security Training
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-2">
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
