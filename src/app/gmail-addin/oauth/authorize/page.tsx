"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ViewState =
  | "checking"
  | "ready"
  | "authorizing"
  | "error";

export default function GmailOAuthAuthorizePage() {
  const [view, setView] = useState<ViewState>("checking");
  const [message, setMessage] = useState("Checking your MicroSECONDS account...");
  const [email, setEmail] = useState("");

  const params = useMemo(() => {
    if (typeof window === "undefined") {
      return { clientId: "", redirectUri: "", state: "", responseType: "" };
    }

    const search = new URLSearchParams(window.location.search);
    return {
      clientId: search.get("client_id") || "",
      redirectUri: search.get("redirect_uri") || "",
      state: search.get("state") || "",
      responseType: search.get("response_type") || "",
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!params.clientId || !params.redirectUri || params.responseType !== "code") {
        if (!cancelled) {
          setView("error");
          setMessage("The Gmail authorization request is incomplete.");
        }
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }

      const { data: factorData } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factorData?.totp?.find(
        (item: any) => item.status === "verified"
      );

      if (verifiedFactor) {
        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aal?.currentLevel !== "aal2") {
          const returnTo = window.location.pathname + window.location.search;
          window.location.href = `/mfa?returnTo=${encodeURIComponent(returnTo)}`;
          return;
        }
      }

      if (!cancelled) {
        setEmail(session.user.email || "");
        setView("ready");
        setMessage("");
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function authorize() {
    setView("authorizing");
    setMessage("Authorizing Gmail...");

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }

      const response = await fetch("/api/gmail-addon/oauth/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          state: params.state,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.redirect_url) {
        throw new Error(
          result.message ||
            result.error ||
            "MicroSECONDS could not authorize Gmail."
        );
      }

      window.location.replace(result.redirect_url);
    } catch (error: any) {
      setView("error");
      setMessage(error?.message || "MicroSECONDS could not authorize Gmail.");
    }
  }

  function cancel() {
    window.close();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900 p-7 shadow-2xl">
        <div className="text-sm font-semibold text-cyan-300">
          MicroSECONDS Email Risk Analyzer
        </div>

        <h1 className="mt-2 text-2xl font-bold">
          {view === "error" ? "Unable to connect Gmail" : "Connect Gmail"}
        </h1>

        {view === "checking" || view === "authorizing" ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300" />
            {message}
          </div>
        ) : null}

        {view === "ready" ? (
          <>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Gmail is requesting permission to connect to your MicroSECONDS account
              <span className="font-semibold text-white">
                {email ? ` (${email})` : ""}
              </span>.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-4 text-sm leading-6 text-slate-400">
              Once connected, the Gmail add-on can send the email you choose to
              MicroSECONDS Email Risk Analyzer and display the resulting risk assessment.
              Your MicroSECONDS password is never shared with Gmail.
            </div>

            <button
              type="button"
              onClick={authorize}
              className="mt-6 w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Authorize Gmail
            </button>

            <button
              type="button"
              onClick={cancel}
              className="mt-3 w-full rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </>
        ) : null}

        {view === "error" ? (
          <>
            <p className="mt-4 text-sm leading-6 text-red-200">{message}</p>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Close this window and try signing in again from the MicroSECONDS Gmail add-on.
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
