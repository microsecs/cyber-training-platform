"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { defaultPathForRole, resolveUserAccess } from "@/lib/supabase/access";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { company_name: company },
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });

      if (error) setMessage(error.message);
      else setMessage("Account created. Check your email if confirmation is enabled.");

      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    const access = await resolveUserAccess();

    const { data: factorData } = await supabase.auth.mfa.listFactors();
    const verifiedFactor = factorData?.totp?.find(
      (item: any) => item.status === "verified"
    );

    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      (access.role === "platform_admin" ||
        access.role === "owner" ||
        access.role === "admin") &&
      !verifiedFactor
    ) {
      window.location.href = "/mfa/setup?optional=1";
      return;
    }

    if (verifiedFactor && aalData?.currentLevel !== "aal2") {
      window.location.href = "/mfa";
      return;
    }

    window.location.href = defaultPathForRole(access.role);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900 p-7">
      <div className="mb-6 flex rounded-lg bg-slate-950 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setMessage("");
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
            mode === "signin" ? "bg-white/10 text-white" : "text-slate-400"
          }`}
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setMessage("");
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
            mode === "signup" ? "bg-white/10 text-white" : "text-slate-400"
          }`}
        >
          Create Company Account
        </button>
      </div>

      <h1 className="text-2xl font-bold">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>

      <p className="mt-2 text-sm text-slate-400">
        {mode === "signin"
          ? "Sign in to your MicroSECONDS Training account."
          : "This will become the primary administrator account for your company."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <div>
            <label className="mb-2 block text-sm text-slate-300">Company name</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400/50"
              placeholder="ABC Plumbing"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400/50"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400/50"
            placeholder="Minimum 6 characters"
          />
        </div>

        <button
          disabled={busy}
          className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
        >
          {busy ? "Working..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      {mode === "signin" ? (
        <div className="mt-4 text-center">
          <a href="/forgot-password" className="text-sm text-cyan-300 hover:text-cyan-200">
            Forgot Password?
          </a>
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}
    </div>
  );
}
