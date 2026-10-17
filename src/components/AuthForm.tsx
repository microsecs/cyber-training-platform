"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { defaultPathForRole, resolveUserAccess } from "@/lib/supabase/access";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "signup") {
      setMode("signup");
    }
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const supabase = createClient();

    if (mode === "signup") {
      try {
        const prepareResponse = await fetch("/api/auth/company-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, company }),
        });

        const prepareResult = await prepareResponse.json();

        if (!prepareResponse.ok) {
          setMessage(prepareResult.error || "Could not prepare company signup.");
          setBusy(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { company_name: company },
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });

        if (error) {
          setMessage(error.message);
        } else if (data.session) {
          // If email confirmation is disabled in Supabase, do not leave a new
          // company owner sitting on the signup page with an active session.
          window.location.href = "/account";
          return;
        } else {
          setMessage("Account created. Check your email to confirm your account before signing in.");
        }
      } catch (error: any) {
        setMessage(error?.message || "Could not create company account.");
      }

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

    if (access.role === "authenticated") {
      await supabase.auth.signOut();
      setMessage(
        "This login is not connected to an active company. Choose Create Company Account to start a new company, or contact MicroSECONDS support."
      );
      setBusy(false);
      return;
    }

    const requestedNext =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;

    const safeNext =
      requestedNext &&
      requestedNext.startsWith("/") &&
      !requestedNext.startsWith("//")
        ? requestedNext
        : defaultPathForRole(access.role);

    const { data: factorData } = await supabase.auth.mfa.listFactors();
    const verifiedFactor = factorData?.totp?.find(
      (item: any) => item.status === "verified"
    );

    if (verifiedFactor) {
      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalData?.currentLevel !== "aal2") {
        window.location.href = `/mfa?returnTo=${encodeURIComponent(safeNext)}`;
        return;
      }
    }

    window.location.href = safeNext;
  }

  return (
    <div className="mx-auto w-full max-w-[480px] rounded-[20px] border border-slate-700/70 bg-[#111827] p-5 shadow-xl sm:p-7">
      <div className="mb-5 border-b border-slate-700/70 pb-4 text-center">
        <Image src="/microseconds-logo.png" alt="MicroSECONDS" width={835} height={109} priority className="mx-auto h-auto w-full max-w-[265px] object-contain" />
        <div className="mt-2 text-sm font-bold tracking-[0.25em] text-teal-300">TRAINING</div>
      </div>
      <div className="mb-4 flex rounded-lg bg-slate-950 p-1">
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

      <p className="mt-1 text-sm text-slate-400">
        {mode === "signin"
          ? "Sign in to your MicroSECONDS Training account."
          : "This will become the primary administrator account for your company."}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {mode === "signup" ? (
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Company name</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-[#0c1625] px-4 py-2.5 outline-none focus:border-teal-400/60"
              placeholder="ABC Plumbing"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-200">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-[#0c1625] px-4 py-2.5 outline-none focus:border-teal-400/60"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-200">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-700 bg-[#0c1625] px-4 py-2.5 outline-none focus:border-teal-400/60"
            placeholder="Minimum 6 characters"
          />
        </div>

        <button
          disabled={busy}
          className="w-full rounded-xl bg-teal-300 px-4 py-2.5 font-bold text-slate-950 hover:bg-teal-200 disabled:opacity-60"
        >
          {busy ? "Working..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      {mode === "signin" ? (
        <div className="mt-3 text-center">
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
