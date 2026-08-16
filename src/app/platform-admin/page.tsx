"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PlatformAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function checkAccess() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setAuthorized(false);
        return;
      }

      const { data } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      setAuthorized(!!data);
    }

    checkAccess();
  }, []);

  if (authorized === null) {
    return <main className="mx-auto max-w-6xl px-6 py-12">Checking platform access...</main>;
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Platform Admin Required</h1>
        <p className="mt-3 text-slate-400">
          This account does not have platform administration access.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="text-sm text-cyan-300">CyberAware Platform</div>
      <h1 className="mt-1 text-4xl font-bold">Platform Admin</h1>
      <p className="mt-2 text-slate-400">
        Manage the master course library and platform-level settings.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link
          href="/admin/courses"
          className="rounded-2xl border border-white/10 bg-slate-900 p-6 hover:border-cyan-400/40"
        >
          <div className="text-xl font-semibold">Master Course Library</div>
          <p className="mt-2 text-sm text-slate-400">
            Create, edit, activate, and manage all training courses.
          </p>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="text-xl font-semibold">Customer Companies</div>
          <p className="mt-2 text-sm text-slate-400">
            Company management will be added here next.
          </p>
        </div>
      </div>
    </main>
  );
}
