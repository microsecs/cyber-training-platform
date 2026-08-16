"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CourseAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const s = createClient();

    (async () => {
      const { data: userData } = await s.auth.getUser();

      if (!userData.user) {
        setAuthorized(false);
        return;
      }

      const { data } = await s
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      setAuthorized(!!data);
    })();
  }, []);

  if (authorized === null) {
    return <main className="p-10">Checking platform access...</main>;
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Platform Admin Required</h1>
        <p className="mt-3 text-slate-400">
          Company owners and administrators cannot edit the master course library.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="text-sm text-cyan-300">Platform Administration</div>
      <h1 className="mt-1 text-4xl font-bold">Course Management</h1>
      <p className="mt-3 text-slate-400">
        Platform-admin access is confirmed. Keep your existing V7.1 course editor here.
      </p>
      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
        This V7.2 file intentionally gates the route. If you already installed the full V7.1 course editor,
        preserve its editor UI below this authorization check.
      </div>
    </main>
  );
}
