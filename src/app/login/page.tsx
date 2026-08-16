"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendReset(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset email sent. Check your inbox.");
    }

    setBusy(false);
  }

  return (
    <main className="px-6 py-16">
      {!showReset ? (
        <div>
          <AuthForm />
          <div className="mx-auto mt-4 max-w-md text-center">
            <button
              onClick={() => setShowReset(true)}
              className="text-sm text-cyan-300 hover:text-cyan-200"
            >
              Forgot password?
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900 p-7">
          <div className="text-sm text-cyan-300">Password Recovery</div>
          <h1 className="mt-2 text-2xl font-bold">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the email address for your account.
          </p>

          <form onSubmit={sendReset} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
            />

            <button
              disabled={busy}
              className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {busy ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-300">
              {message}
            </div>
          )}

          <button
            onClick={() => {
              setShowReset(false);
              setMessage("");
            }}
            className="mt-5 text-sm text-slate-400 hover:text-white"
          >
            Back to sign in
          </button>
        </div>
      )}
    </main>
  );
}
