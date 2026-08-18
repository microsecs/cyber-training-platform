"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  defaultPathForRole,
  resolveUserAccess,
  UserAccess,
} from "@/lib/supabase/access";

export default function AccountPage() {
  const [access, setAccess] = useState<UserAccess | null>(null);

  useEffect(() => {
    resolveUserAccess().then(setAccess);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!access) {
    return <main className="mx-auto max-w-4xl px-6 pt-6 pb-16">Loading account...</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pt-6 pb-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
        <div className="text-sm text-cyan-300">MicroSECONDS Training</div>
        <h1 className="mt-2 text-3xl font-bold">Account</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
            <div className="text-sm text-slate-500">Signed in as</div>
            <div className="mt-2 break-all font-medium">{access.email || "—"}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
            <div className="text-sm text-slate-500">Role</div>
            <div className="mt-2 font-medium capitalize">
              {access.role.replace("_", " ")}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
            <div className="text-sm text-slate-500">Company</div>
            <div className="mt-2 font-medium">{access.companyName || "—"}</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={defaultPathForRole(access.role)}
            className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            Open Dashboard
          </Link>

          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-white/15 px-4 py-3 font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
