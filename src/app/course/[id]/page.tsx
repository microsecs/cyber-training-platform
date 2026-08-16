"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type QuizQuestion = {
  question: string;
  choices: string[];
  answer: number;
};

export default function CoursePage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadCourse() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setMessage("Please sign in first.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("assignments")
        .select(
          "id,status,due_date,courses(id,title,description,duration_minutes,quiz,video_url,passing_score),completions(score,completed_at)"
        )
        .eq("id", assignmentId)
        .eq("user_id", userData.user.id)
        .single();

      if (error || !data) {
        setMessage(error?.message || "Course assignment not found.");
        setLoading(false);
        return;
      }

      setAssignment(data);
      setLoading(false);

      if (data.status === "not_started") {
        await supabase
          .from("assignments")
          .update({ status: "in_progress" })
          .eq("id", assignmentId)
          .eq("user_id", userData.user.id);
      }
    }

    loadCourse();
  }, [assignmentId]);

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-10">Loading course...</main>;
  }

  if (!assignment) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          {message || "Course not found."}
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

  const quiz: QuizQuestion[] = course?.quiz || [];
  const passingScore = course?.passing_score ?? 80;

  async function submitQuiz() {
    if (quiz.length === 0) {
      setMessage("This course does not have a quiz yet.");
      return;
    }

    if (Object.keys(answers).length < quiz.length) {
      setMessage("Answer every question before submitting.");
      return;
    }

    let correct = 0;

    quiz.forEach((question, index) => {
      if (answers[index] === question.answer) correct += 1;
    });

    const score = Math.round((correct / quiz.length) * 100);

    setSubmitting(true);
    setMessage("");

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage("Your session expired. Please sign in again.");
      setSubmitting(false);
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
        passingScore,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Could not submit quiz.");
      setSubmitting(false);
      return;
    }

    if (result.passed) {
      setMessage(`Passed! Score: ${score}%. Training complete.`);
      setAssignment((current: any) => ({
        ...current,
        status: "completed",
        completions: [
          { score, completed_at: new Date().toISOString() },
        ],
      }));
    } else {
      setMessage(
        `Score: ${score}%. You need ${passingScore}% to pass. Please review and try again.`
      );
    }

    setSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
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
        {course?.video_url ? (
          <video
            controls
            className="aspect-video w-full rounded-xl bg-black"
            src={course.video_url}
          >
            Your browser does not support HTML5 video.
          </video>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-950">
            <div className="text-center">
              <div className="text-6xl">▶</div>
              <div className="mt-4 text-slate-400">No training video has been added yet.</div>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500">
          Estimated duration: {course?.duration_minutes} minutes
        </div>
      </section>

      {assignment.status === "completed" && completion ? (
        <section className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6">
          <div className="text-sm text-emerald-300">Training Completed</div>
          <div className="mt-2 text-2xl font-bold">Score: {completion.score}%</div>
          <div className="mt-2 text-sm text-slate-300">
            Completed {new Date(completion.completed_at).toLocaleString()}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Knowledge Check</h2>
          <p className="mt-2 text-sm text-slate-400">
            Score {passingScore}% or higher to complete this course.
          </p>

          <div className="mt-7 space-y-8">
            {quiz.map((question, index) => (
              <div key={index}>
                <div className="font-medium">
                  {index + 1}. {question.question}
                </div>

                <div className="mt-3 space-y-2">
                  {question.choices.map((choice, choiceIndex) => (
                    <label
                      key={choiceIndex}
                      className="flex cursor-pointer gap-3 rounded-lg border border-white/5 bg-slate-950 p-3 hover:border-white/15"
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
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={submitQuiz}
            disabled={submitting}
            className="mt-8 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>

          {message && (
            <div className="mt-4 rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
              {message}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
