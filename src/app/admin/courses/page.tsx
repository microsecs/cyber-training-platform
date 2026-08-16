"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  quiz_question_count: number;
  is_active: boolean;
  video_url: string | null;
  passing_score: number;
  quiz: any[] | null;
};

const blankQuiz = [
  {
    question: "",
    choices: ["", "", ""],
    answer: 0,
  },
];

export default function CourseAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(5);
  const [videoUrl, setVideoUrl] = useState("");
  const [passingScore, setPassingScore] = useState(80);
  const [isActive, setIsActive] = useState(true);
  const [quiz, setQuiz] = useState<any[]>(blankQuiz);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  async function loadCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select("id,title,description,duration_minutes,quiz_question_count,is_active,video_url,passing_score,quiz")
      .order("title");

    if (error) {
      setMessage(error.message);
      return;
    }

    setCourses((data as Course[]) ?? []);
  }

  useEffect(() => {
    async function initialize() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setAuthorized(false);
        return;
      }

      const { data } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!data) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
      await loadCourses();
    }

    initialize();
  }, []);

  function newCourse() {
    setSelectedId("");
    setTitle("");
    setDescription("");
    setDuration(5);
    setVideoUrl("");
    setPassingScore(80);
    setIsActive(true);
    setQuiz([
      {
        question: "",
        choices: ["", "", ""],
        answer: 0,
      },
    ]);
    setMessage("");
  }

  function loadCourse(course: Course) {
    setSelectedId(course.id);
    setTitle(course.title);
    setDescription(course.description ?? "");
    setDuration(course.duration_minutes);
    setVideoUrl(course.video_url ?? "");
    setPassingScore(course.passing_score ?? 80);
    setIsActive(course.is_active);
    setQuiz(course.quiz?.length ? course.quiz : blankQuiz);
    setMessage("");
  }

  function updateQuestion(index: number, field: string, value: any) {
    setQuiz((current) =>
      current.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    );
  }

  function updateChoice(qIndex: number, cIndex: number, value: string) {
    setQuiz((current) =>
      current.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              choices: q.choices.map((choice: string, j: number) =>
                j === cIndex ? value : choice
              ),
            }
          : q
      )
    );
  }

  function addQuestion() {
    setQuiz((current) => [
      ...current,
      {
        question: "",
        choices: ["", "", ""],
        answer: 0,
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuiz((current) => current.filter((_, i) => i !== index));
  }

  async function saveCourse() {
    setBusy(true);
    setMessage("");

    const cleanQuiz = quiz
      .filter((q) => q.question.trim())
      .map((q) => ({
        question: q.question.trim(),
        choices: q.choices.map((c: string) => c.trim()),
        answer: Number(q.answer),
      }));

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      duration_minutes: Number(duration),
      quiz_question_count: cleanQuiz.length,
      is_active: isActive,
      video_url: videoUrl.trim() || null,
      passing_score: Number(passingScore),
      quiz: cleanQuiz,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (selectedId) {
      result = await supabase
        .from("courses")
        .update(payload)
        .eq("id", selectedId);
    } else {
      result = await supabase
        .from("courses")
        .insert(payload)
        .select("id")
        .single();
    }

    if (result.error) {
      setMessage(result.error.message);
      setBusy(false);
      return;
    }

    setMessage(selectedId ? "Course updated." : "Course created.");
    await loadCourses();

    if (!selectedId && result.data?.id) {
      setSelectedId(result.data.id);
    }

    setBusy(false);
  }

  if (authorized === null) {
    return <main className="mx-auto max-w-7xl px-6 py-12">Checking platform access...</main>;
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Platform Admin Required</h1>
        <p className="mt-3 text-slate-400">
          Company owners and administrators cannot edit the master course library.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm text-cyan-300">Platform Administration</div>
          <h1 className="mt-1 text-4xl font-bold">Master Course Library</h1>
          <p className="mt-2 text-slate-400">
            Create and edit the training content available to all customer companies.
          </p>
        </div>

        <Link
          href="/platform-admin"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5"
        >
          Back to Platform Admin
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.5fr]">
        <aside className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <button
            onClick={newCourse}
            className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            + New Course
          </button>

          <div className="mt-5 space-y-2">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => loadCourse(course)}
                className={`w-full rounded-lg border p-4 text-left ${
                  selectedId === course.id
                    ? "border-cyan-400 bg-cyan-400/5"
                    : "border-white/10 bg-slate-950"
                }`}
              >
                <div className="font-medium">{course.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {course.is_active ? "Active" : "Inactive"} • {course.duration_minutes} min
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-slate-950 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg bg-slate-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm">Default Passing Score (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm">Video URL</label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg bg-slate-950 px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Course is active</span>
              </label>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Quiz Questions</h2>
              <button
                onClick={addQuestion}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm"
              >
                + Add Question
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {quiz.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="rounded-xl border border-white/10 bg-slate-950 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <label className="mb-2 block text-sm">
                        Question {qIndex + 1}
                      </label>
                      <input
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(qIndex, "question", e.target.value)
                        }
                        className="w-full rounded-lg bg-slate-900 px-4 py-3"
                      />
                    </div>

                    {quiz.length > 1 ? (
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="mt-7 text-sm text-rose-300"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    {q.choices.map((choice: string, cIndex: number) => (
                      <label key={cIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={Number(q.answer) === cIndex}
                          onChange={() =>
                            updateQuestion(qIndex, "answer", cIndex)
                          }
                        />
                        <input
                          value={choice}
                          onChange={(e) =>
                            updateChoice(qIndex, cIndex, e.target.value)
                          }
                          placeholder={`Choice ${cIndex + 1}`}
                          className="flex-1 rounded-lg bg-slate-900 px-4 py-3"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={saveCourse}
              disabled={!title.trim() || busy}
              className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40"
            >
              {busy ? "Saving..." : selectedId ? "Save Changes" : "Create Course"}
            </button>

            {message && (
              <span className="text-sm text-slate-300">{message}</span>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
