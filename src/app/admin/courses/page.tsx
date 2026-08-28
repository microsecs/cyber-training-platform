"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CourseAdminPage() {
  const supabase = createClient();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(5);
  const [passingScore, setPassingScore] = useState(80);
  const [isActive, setIsActive] = useState(true);
  const [videoKey, setVideoKey] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [quiz, setQuiz] = useState<any[]>([
    { question: "", choices: ["", "", ""], answer: 0 },
  ]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);

  async function loadCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id,title,description,duration_minutes,passing_score,is_active,video_key,video_url,quiz"
      )
      .order("title");

    if (error) {
      setMessage(error.message);
      return;
    }

    setCourses(data ?? []);
  }

  useEffect(() => {
    (async () => {
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

      setAuthorized(!!data);

      if (data) {
        await loadCourses();
      }
    })();
  }, []);

  function newCourse() {
    setSelectedId("");
    setTitle("");
    setDescription("");
    setDuration(5);
    setPassingScore(80);
    setIsActive(true);
    setVideoKey("");
    setVideoUrl("");
    setQuiz([{ question: "", choices: ["", "", ""], answer: 0 }]);
    setPreviewUrl("");
    setMessage("");
  }

  function chooseCourse(course: any) {
    setSelectedId(course.id);
    setTitle(course.title);
    setDescription(course.description ?? "");
    setDuration(course.duration_minutes ?? 5);
    setPassingScore(course.passing_score ?? 80);
    setIsActive(course.is_active);
    setVideoKey(course.video_key ?? "");
    setVideoUrl(course.video_url ?? "");
    setQuiz(
      course.quiz?.length
        ? course.quiz
        : [{ question: "", choices: ["", "", ""], answer: 0 }]
    );
    setPreviewUrl("");
    setMessage("");
  }

  async function uploadVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedId) {
      setMessage(
        "Create/save the course first, then select it and upload the video."
      );
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage("Your session expired. Please sign in again.");
      setUploading(false);
      return;
    }

    const presignResponse = await fetch("/api/r2/upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "video/mp4",
        size: file.size,
      }),
    });

    const presign = await presignResponse.json();

    if (!presignResponse.ok) {
      setMessage(presign.error || "Could not prepare R2 upload.");
      setUploading(false);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presign.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadPercent(
          Math.round((event.loaded / event.total) * 100)
        );
      }
    };

    xhr.onload = async () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        setMessage(
          `R2 upload failed with HTTP ${xhr.status}. Check the R2 CORS policy.`
        );
        setUploading(false);
        return;
      }

      // Immediately persist the R2 key on the selected course.
      const { error: saveError } = await supabase
        .from("courses")
        .update({
          video_key: presign.key,
          video_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedId);

      if (saveError) {
        setMessage(
          `Video reached R2, but the course could not be updated: ${saveError.message}`
        );
        setUploading(false);
        return;
      }

      setVideoKey(presign.key);
      setVideoUrl("");
      setPreviewUrl("");
      setMessage("Video uploaded to R2 and attached to this course. Click Preview Video to review it.");
      await loadCourses();
      setUploading(false);
    };

    xhr.onerror = () => {
      setMessage(
        "R2 upload failed. Check the bucket CORS policy and Cloudflare credentials."
      );
      setUploading(false);
    };

    xhr.send(file);
  }


  async function loadVideoPreview() {
    if (!selectedId) return;

    setPreviewLoading(true);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage("Your session expired. Please sign in again.");
      setPreviewLoading(false);
      return;
    }

    const response = await fetch(
      `/api/r2/admin-course-preview-url?courseId=${encodeURIComponent(selectedId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Video preview is unavailable.");
      setPreviewLoading(false);
      return;
    }

    setPreviewUrl(result.videoUrl);
    setPreviewLoading(false);
  }

  async function deleteVideo() {
    if (!selectedId || (!videoKey && !videoUrl)) return;

    const confirmed = window.confirm(
      videoKey
        ? "Delete this training video from Cloudflare R2 and remove it from the course? This cannot be undone."
        : "Remove this external video from the course?"
    );

    if (!confirmed) return;

    setDeletingVideo(true);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMessage("Your session expired. Please sign in again.");
      setDeletingVideo(false);
      return;
    }

    const response = await fetch("/api/r2/delete-course-video", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ courseId: selectedId }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Could not delete the video.");
      setDeletingVideo(false);
      return;
    }

    setVideoKey("");
    setVideoUrl("");
    setPreviewUrl("");
    setMessage(
      result.deletedFromR2
        ? "Video deleted from R2 and removed from the course."
        : "Video removed from the course."
    );
    await loadCourses();
    setDeletingVideo(false);
  }

  function updateQuestion(index: number, field: string, value: any) {
    setQuiz((current) =>
      current.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    );
  }

  function updateChoice(
    questionIndex: number,
    choiceIndex: number,
    value: string
  ) {
    setQuiz((current) =>
      current.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              choices: q.choices.map(
                (choice: string, j: number) =>
                  j === choiceIndex ? value : choice
              ),
            }
          : q
      )
    );
  }

  async function saveCourse() {
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
      passing_score: Number(passingScore),
      is_active: isActive,
      video_key: videoKey || null,
      video_url: videoKey ? null : videoUrl.trim() || null,
      quiz: cleanQuiz,
      quiz_question_count: cleanQuiz.length,
      updated_at: new Date().toISOString(),
    };

    const result = selectedId
      ? await supabase
          .from("courses")
          .update(payload)
          .eq("id", selectedId)
      : await supabase
          .from("courses")
          .insert(payload)
          .select("id")
          .single();

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (!selectedId && result.data?.id) {
      setSelectedId(result.data.id);
      setMessage(
        "Course created. Select it from the left, then upload its video."
      );
    } else {
      setMessage("Course updated.");
    }

    await loadCourses();
  }

  if (authorized === null) {
    return <main className="p-10">Checking access...</main>;
  }

  if (!authorized) {
    return <main className="p-10">Platform admin required.</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-sm text-cyan-300">
        Platform Administration
      </div>
      <h1 className="mt-1 text-4xl font-bold">
        Master Course Library
      </h1>

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
                onClick={() => chooseCourse(course)}
                className={`w-full rounded-lg border p-4 text-left ${
                  selectedId === course.id
                    ? "border-cyan-400"
                    : "border-white/10 bg-slate-950"
                }`}
              >
                <div className="font-medium">{course.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {course.video_key
                    ? "R2 video attached"
                    : course.video_url
                    ? "External video"
                    : "No video"}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Course title"
            className="w-full rounded-lg bg-slate-950 px-4 py-3"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={4}
            className="w-full rounded-lg bg-slate-950 px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="rounded-lg bg-slate-950 px-4 py-3"
              placeholder="Duration"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) =>
                setPassingScore(Number(e.target.value))
              }
              className="rounded-lg bg-slate-950 px-4 py-3"
              placeholder="Passing score"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
            <div className="font-medium">
              Cloudflare R2 Training Video
            </div>

            {selectedId ? (
              <>
                <input
                  type="file"
                  accept="video/*"
                  onChange={uploadVideo}
                  disabled={uploading}
                  className="mt-3 block w-full text-sm"
                />

                {uploading ? (
                  <div className="mt-3 text-sm text-slate-400">
                    Uploading {uploadPercent}%
                  </div>
                ) : null}

                {videoKey ? (
                  <div className="mt-3">
                    <div className="text-sm text-emerald-300">
                      ✓ R2 video attached
                    </div>
                    <div className="mt-1 break-all text-xs text-slate-500">
                      {videoKey}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-500">
                    No R2 video attached.
                  </div>
                )}

                {videoKey || videoUrl ? (
                  <div className="mt-4 space-y-3">
                    {previewUrl ? (
                      <video
                        key={previewUrl}
                        controls
                        preload="metadata"
                        src={previewUrl}
                        className="aspect-video w-full rounded-lg bg-black"
                      >
                        Your browser does not support video playback.
                      </video>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={loadVideoPreview}
                        disabled={previewLoading || deletingVideo}
                        className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                      >
                        {previewLoading
                          ? "Loading Preview..."
                          : previewUrl
                          ? "Refresh Preview"
                          : "Preview Video"}
                      </button>

                      <button
                        type="button"
                        onClick={deleteVideo}
                        disabled={deletingVideo || uploading}
                        className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-400/20 disabled:opacity-50"
                      >
                        {deletingVideo ? "Deleting..." : "Delete Video"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-3 text-sm text-amber-300">
                Create the course first, then select it to upload a video.
              </div>
            )}

            <input
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setPreviewUrl("");
                if (e.target.value) setVideoKey("");
              }}
              placeholder="Or external video URL"
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3"
            />
          </div>

          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Course is active
          </label>

          <div>
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">
                Quiz Questions
              </h2>

              <button
                onClick={() =>
                  setQuiz([
                    ...quiz,
                    {
                      question: "",
                      choices: ["", "", ""],
                      answer: 0,
                    },
                  ])
                }
                className="text-sm text-cyan-300"
              >
                + Add Question
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {quiz.map((q, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-slate-950 p-4"
                >
                  <input
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(i, "question", e.target.value)
                    }
                    placeholder={`Question ${i + 1}`}
                    className="w-full rounded-lg bg-slate-900 px-3 py-2"
                  />

                  <div className="mt-3 space-y-2">
                    {q.choices.map(
                      (choice: string, j: number) => (
                        <label key={j} className="flex gap-3">
                          <input
                            type="radio"
                            name={`correct-${i}`}
                            checked={Number(q.answer) === j}
                            onChange={() =>
                              updateQuestion(i, "answer", j)
                            }
                          />

                          <input
                            value={choice}
                            onChange={(e) =>
                              updateChoice(i, j, e.target.value)
                            }
                            placeholder={`Choice ${j + 1}`}
                            className="flex-1 rounded-lg bg-slate-900 px-3 py-2"
                          />
                        </label>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveCourse}
            disabled={!title.trim() || uploading}
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40"
          >
            {selectedId ? "Save Changes" : "Create Course"}
          </button>

          {message ? (
            <div className="rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
              {message}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
