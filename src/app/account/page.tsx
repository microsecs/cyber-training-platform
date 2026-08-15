"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      setCompany((data.user?.user_metadata?.company_name as string) ?? null);
      setLoading(false);
    }

    loadUser();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-16">Loading account...</main>;
  }

  if (!email) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
          <h1 className="text-2xl font-bold">You are not signed in.</h1>
          <a href="/login" className="mt-5 inline-block rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950">
            Go to Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
        <div className="text-sm text-cyan-300">Supabase Connected</div>
        <h1 className="mt-2 text-3xl font-bold">Account</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
            <div className="text-sm text-slate-500">Signed in as</div>
            <div className="mt-2 font-medium">{email}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
            <div className="text-sm text-slate-500">Company</div>
            <div className="mt-2 font-medium">{company || "Not set"}</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/admin" className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950">
            Open Admin Dashboard
          </a>
          <button onClick={signOut} className="rounded-lg border border-white/15 px-4 py-3 font-semibold">
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
