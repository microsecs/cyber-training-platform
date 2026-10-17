"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultPathForRole, resolveUserAccess } from "@/lib/supabase/access";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    resolveUserAccess()
      .then((access) => {
        if (active) router.replace(defaultPathForRole(access.role));
      })
      .catch(() => {
        if (active) router.replace("/login");
      });
    return () => { active = false; };
  }, [router]);

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-6 text-center">
      <p className="text-sm text-slate-400" role="status">Opening MicroSECONDS Training…</p>
    </main>
  );
}
