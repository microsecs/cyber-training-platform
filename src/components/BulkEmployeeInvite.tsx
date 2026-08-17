"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function extractEmails(text: string) {
  const emailPattern =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

  const matches = text.match(emailPattern) ?? [];

  return Array.from(
    new Set(
      matches.map((email) =>
        email.trim().toLowerCase()
      )
    )
  );
}

export default function BulkEmployeeInvite({
  onComplete,
}: {
  onComplete?: () => void | Promise<void>;
}) {
  const [emails, setEmails] =
    useState<string[]>([]);
  const [fileName, setFileName] =
    useState("");
  const [busy, setBusy] =
    useState(false);
  const [message, setMessage] =
    useState("");

  async function chooseFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setMessage("");

    const text =
      await file.text();

    const found =
      extractEmails(text);

    setEmails(found);

    if (!found.length) {
      setMessage(
        "No email addresses were found in that CSV file."
      );
    } else {
      setMessage(
        `${found.length} unique email address${
          found.length === 1 ? "" : "es"
        } found.`
      );
    }
  }

  async function sendBulkInvites() {
    if (!emails.length) return;

    setBusy(true);
    setMessage("");

    const supabase =
      createClient();

    const { data } =
      await supabase.auth.getSession();

    const token =
      data.session?.access_token;

    if (!token) {
      setMessage(
        "Your session expired. Please sign in again."
      );
      setBusy(false);
      return;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (
      const email of emails
    ) {
      try {
        const response =
          await fetch(
            "/api/invite",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                email,
                role: "employee",
              }),
            }
          );

        if (response.ok) {
          sent++;
          continue;
        }

        const result =
          await response.json();

        const reason =
          String(
            result.error || ""
          ).toLowerCase();

        if (
          response.status === 409 ||
          reason.includes(
            "already"
          )
        ) {
          skipped++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setMessage(
      `Bulk invite complete: ${sent} sent, ${skipped} skipped, ${failed} failed.`
    );

    setBusy(false);

    if (onComplete) {
      await onComplete();
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">
        Bulk Invite Employees
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Upload a CSV containing employee email addresses. The file can contain an Email column, additional columns, or simply one email address per line.
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={chooseFile}
        disabled={busy}
        className="mt-5 block w-full text-sm text-slate-300"
      />

      {fileName ? (
        <div className="mt-2 text-xs text-slate-500">
          {fileName}
        </div>
      ) : null}

      {emails.length ? (
        <div className="mt-4 rounded-lg bg-slate-950 p-4">
          <div className="text-sm font-medium">
            {emails.length} employee email address{emails.length === 1 ? "" : "es"} ready
          </div>

          <div className="mt-2 max-h-36 overflow-auto text-xs text-slate-500">
            {emails
              .slice(0, 20)
              .map((email) => (
                <div key={email}>
                  {email}
                </div>
              ))}

            {emails.length >
            20 ? (
              <div className="mt-1">
                + {emails.length - 20} more
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={sendBulkInvites}
        disabled={
          busy ||
          !emails.length
        }
        className="mt-5 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40"
      >
        {busy
          ? "Sending Invitations..."
          : `Send ${emails.length || ""} Invitations`}
      </button>

      {message ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}
    </div>
  );
}
