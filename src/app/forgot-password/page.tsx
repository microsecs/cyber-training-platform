"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setBusy(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(
        result.error ||
          "Could not send password reset email."
      );
      setBusy(false);
      return;
    }

    setMessage(
      result.message ||
        "If an account exists for that email, a password reset message has been sent."
    );

    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-14">
      <div className="text-sm text-cyan-300">
        MicroSECONDS Training
      </div>

      <h1 className="mt-1 text-4xl font-bold">
        Forgot Password
      </h1>

      <p className="mt-3 text-slate-400">
        Enter your email address and we’ll send you a secure password reset link.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6"
      >
        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Email Address
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3"
            placeholder="you@company.com"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40"
        >
          {busy
            ? "Sending..."
            : "Send Password Reset"}
        </button>

        {message ? (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-cyan-300 hover:text-cyan-200"
        >
          Back to Sign In
        </Link>
      </div>
    </main>
  );
}
