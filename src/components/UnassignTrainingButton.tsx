"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UnassignTrainingButton({
  assignmentId,
  courseTitle,
  employeeName,
  disabled = false,
  onUnassigned,
}: {
  assignmentId: string;
  courseTitle: string;
  employeeName: string;
  disabled?: boolean;
  onUnassigned?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function unassign() {
    const confirmed = window.confirm(
      `Unassign "${courseTitle}" from ${employeeName}?\n\nThis removes the current assignment and its reminder history. Completed training cannot be unassigned.`
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setMessage("Session expired.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/assignments/unassign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.error ||
          "Could not unassign training."
      );
      setBusy(false);
      return;
    }

    setMessage("Training unassigned.");
    setBusy(false);

    if (onUnassigned) {
      onUnassigned();
    } else {
      window.location.reload();
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={unassign}
        disabled={disabled || busy}
        className="w-full rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300 disabled:opacity-40"
      >
        {busy ? "Removing..." : "Unassign"}
      </button>

      {message ? (
        <div className="mt-1 text-xs text-slate-500">
          {message}
        </div>
      ) : null}
    </div>
  );
}
