"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CoursePage() {
  const assignmentId = useParams().id as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadCourse() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setMessage("Please sign in first.");
        return;
      }

      const { data, error } = await supabase
        .from("assignments")
        .select(
          "id,status,quiz_required,due_date,courses(title,description,duration_minutes,quiz,passing_score),completions(score,completed_at)"
        )
        .eq("id", assignmentId)
        .eq("user_id", userData.user.id)
        .single();

      if (error || !data) {
        setMessage(error?.message || "Course assignment not found.");
        return;
      }

      setAssignment(data);

      if (data.status === "not_started") {
        await supabase
          .from("assignments")
          .update({ status: "in_progress" })
          .eq("id", assignmentId)
          .eq("user_id", userData.user.id);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (token) {
        const response = await fetch(
          `/api/r2/video-url?assignmentId=${encodeURIComponent(assignmentId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setVideoUrl(result.videoUrl);
        } else {
          setVideoError(result.error || "Video is unavailable.");
        }
      }
    }

    loadCourse();
  }, [assignmentId]);

  if (!assignment) {
    return (
      <main className="mx-auto max-w-4xl px-6 pt-6 pb-10">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          {message || "Loading course..."}
        </div>
      </main>
    );
  }

  const course = Array.isArray(assignment.courses)
    ? assignment.courses[0]
    : assignment.courses;

  const completion = Array.isArray(assignment.completions)
    ? assignment.completions[0]
    : assignment.completions;

  const quiz = course?.quiz || [];
  const passingScore = course?.passing_score ?? 80;

  async function completeTraining(score?: number) {
    setBusy(true);
    setMessage("");

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage("Your session expired. Please sign in again.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId,
        score,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Could not complete training.");
      setBusy(false);
      return;
    }

    if (!result.passed) {
      setMessage(
        `You need ${result.passingScore ?? passingScore}% to pass. Please review the lesson and try again.`
      );
      setBusy(false);
      return;
    }

    const completedAt = new Date().toISOString();

    setAssignment((current: any) => ({
      ...current,
      status: "completed",
      completions: [
        {
          score: current.quiz_required ? score ?? null : null,
          completed_at: completedAt,
        },
      ],
    }));

    setMessage(
      assignment.quiz_required
        ? "Training complete."
        : "Training marked complete."
    );

    setBusy(false);
  }

  function submitQuiz() {
    if (quiz.length === 0) {
      setMessage("This course does not have a quiz configured.");
      return;
    }

    if (Object.keys(answers).length < quiz.length) {
      setMessage("Answer every question before submitting.");
      return;
    }

    let correct = 0;

    quiz.forEach((question: any, index: number) => {
      if (answers[index] === question.answer) {
        correct++;
      }
    });

    const score = Math.round((correct / quiz.length) * 100);
    completeTraining(score);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pt-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">Training Course</div>
          <h1 className="mt-1 text-4xl font-bold">{course?.title}</h1>
        </div>

        <Link
          href="/employee"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/5"
        >
          Back to My Training
        </Link>
      </div>

      <p className="mt-4 text-slate-400">{course?.description}</p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        {videoUrl ? (
          <video
            controls
            src={videoUrl}
            className="aspect-video w-full rounded-xl bg-black"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-950 text-center text-slate-400">
            {videoError || "Loading secure video..."}
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500">
          Estimated duration: {course?.duration_minutes ?? "—"} minutes
        </div>
      </section>

      {assignment.status === "completed" ? (
        <section className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6">
          <div className="text-sm text-emerald-300">
            Training Completed
          </div>

          {completion?.score != null ? (
            <div className="mt-2 text-2xl font-bold">
              Score: {completion.score}%
            </div>
          ) : (
            <div className="mt-2 text-slate-300">
              Quiz was not required for this assignment.
            </div>
          )}

          {completion?.completed_at ? (
            <div className="mt-2 text-sm text-slate-400">
              Completed{" "}
              {new Date(completion.completed_at).toLocaleString()}
            </div>
          ) : null}
        </section>
      ) : assignment.quiz_required ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Knowledge Check</h2>

          <p className="mt-2 text-sm text-slate-400">
            Score {passingScore}% or higher to complete this course.
          </p>

          <div className="mt-6 space-y-7">
            {quiz.map((question: any, index: number) => (
              <div key={index}>
                <div className="font-medium">
                  {index + 1}. {question.question}
                </div>

                <div className="mt-3 space-y-2">
                  {question.choices.map(
                    (choice: string, choiceIndex: number) => (
                      <label
                        key={choiceIndex}
                        className="flex cursor-pointer gap-3 rounded-lg bg-slate-950 p-3"
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={answers[index] === choiceIndex}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [index]: choiceIndex,
                            }))
                          }
                        />
                        <span>{choice}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={submitQuiz}
            className="mt-7 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {busy ? "Submitting..." : "Submit Quiz"}
          </button>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">
            Finish Training
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            No quiz is required for this assignment. After reviewing the training,
            mark it complete below.
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => completeTraining()}
            className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {busy ? "Completing..." : "Mark Training Complete"}
          </button>
        </section>
      )}

      {message && (
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
          {message}
        </div>
      )}
    </main>
  );
}
