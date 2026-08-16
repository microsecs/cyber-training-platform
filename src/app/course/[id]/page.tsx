"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CoursePage() {
  const assignmentId = useParams().id as string;
  const [assignment, setAssignment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = createClient();

    (async () => {
      const { data: userData } = await s.auth.getUser();
      if (!userData.user) return;

      const { data } = await s
        .from("assignments")
        .select("id,status,quiz_required,courses(title,description,duration_minutes,quiz,video_url,passing_score),completions(score,completed_at)")
        .eq("id", assignmentId)
        .eq("user_id", userData.user.id)
        .single();

      setAssignment(data);

      if (data?.status === "not_started") {
        await s
          .from("assignments")
          .update({ status: "in_progress" })
          .eq("id", assignmentId)
          .eq("user_id", userData.user.id);
      }
    })();
  }, [assignmentId]);

  if (!assignment) {
    return <main className="p-10">Loading course...</main>;
  }

  const course = Array.isArray(assignment.courses)
    ? assignment.courses[0]
    : assignment.courses;

  const completion = Array.isArray(assignment.completions)
    ? assignment.completions[0]
    : assignment.completions;

  const quiz = course?.quiz || [];
  const passingScore = course?.passing_score ?? 80;

  async function complete(score?: number) {
    setBusy(true);
    setMessage("");

    const s = createClient();
    const { data } = await s.auth.getSession();

    const response = await fetch("/api/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token}`,
      },
      body: JSON.stringify({ assignmentId, score }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Could not complete training.");
      setBusy(false);
      return;
    }

    if (!result.passed) {
      setMessage(
        `You need ${result.passingScore}% to pass. Please try again.`
      );
      setBusy(false);
      return;
    }

    setMessage(
      assignment.quiz_required
        ? "Training complete."
        : "Training marked complete."
    );

    setAssignment({
      ...assignment,
      status: "completed",
      completions: [
        {
          score: assignment.quiz_required ? score : null,
          completed_at: new Date().toISOString(),
        },
      ],
    });

    setBusy(false);
  }

  function submitQuiz() {
    if (Object.keys(answers).length < quiz.length) {
      setMessage("Answer every question first.");
      return;
    }

    let correct = 0;
    quiz.forEach((q: any, i: number) => {
      if (answers[i] === q.answer) correct++;
    });

    const score = Math.round((correct / quiz.length) * 100);
    complete(score);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">Training Course</div>
          <h1 className="mt-1 text-4xl font-bold">{course?.title}</h1>
        </div>

        <Link
          href="/employee"
          className="rounded-lg border border-white/15 px-4 py-2"
        >
          Back
        </Link>
      </div>

      <p className="mt-4 text-slate-400">{course?.description}</p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        {course?.video_url ? (
          <video
            controls
            src={course.video_url}
            className="aspect-video w-full rounded-xl bg-black"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-950 text-slate-400">
            No video configured yet.
          </div>
        )}
      </section>

      {assignment.status === "completed" ? (
        <section className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6">
          <div className="text-emerald-300">Training Completed</div>
          {completion?.score != null ? (
            <div className="mt-2 text-2xl font-bold">
              Score: {completion.score}%
            </div>
          ) : (
            <div className="mt-2 text-slate-300">
              Quiz was not required for this assignment.
            </div>
          )}
        </section>
      ) : assignment.quiz_required ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Knowledge Check</h2>
          <p className="mt-2 text-sm text-slate-400">
            Score {passingScore}% or higher to complete this course.
          </p>

          <div className="mt-6 space-y-7">
            {quiz.map((q: any, i: number) => (
              <div key={i}>
                <div className="font-medium">
                  {i + 1}. {q.question}
                </div>

                <div className="mt-3 space-y-2">
                  {q.choices.map((choice: string, j: number) => (
                    <label
                      key={j}
                      className="flex gap-3 rounded-lg bg-slate-950 p-3"
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        onChange={() =>
                          setAnswers({ ...answers, [i]: j })
                        }
                      />
                      {choice}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={submitQuiz}
            className="mt-7 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
          >
            Submit Quiz
          </button>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Finish Training</h2>
          <p className="mt-2 text-sm text-slate-400">
            No quiz is required for this assignment.
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => complete()}
            className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
          >
            Mark Training Complete
          </button>
        </section>
      )}

      {message && (
        <div className="mt-4 rounded-lg bg-slate-950 p-4 text-sm">
          {message}
        </div>
      )}
    </main>
  );
}
