"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";
import { companyHasSubscriptionAccess } from "@/lib/subscription";

type Course = {
  id: string;
  title: string;
  description:
    | string
    | null;
  duration_minutes:
    | number
    | null;
  quiz_question_count:
    | number
    | null;
  passing_score:
    | number
    | null;
  video_key:
    | string
    | null;
  video_url:
    | string
    | null;
};

export default function TrainingPage() {
  const { company } = useCompany();
  const hasSubscriptionAccess = company ? companyHasSubscriptionAccess({
    status: company.subscriptionStatus,
    paymentFailedAt: company.subscriptionPaymentFailedAt,
    billingExempt: company.billingExempt,
  }) : true;

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [
    previewUrls,
    setPreviewUrls,
  ] = useState<
    Record<string, string>
  >({});

  const [previewSeconds, setPreviewSeconds] = useState<Record<string, number | null>>({});

  const [
    previewErrors,
    setPreviewErrors,
  ] = useState<
    Record<string, string>
  >({});

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const s = createClient();

    async function loadCourses() {
      const { data } = await s
        .from("courses")
        .select(
          "id,title,description,duration_minutes,quiz_question_count,passing_score,video_key,video_url"
        )
        .eq("is_active", true)
        .order("title");

      setCourses(
        (data as Course[]) ??
          []
      );
    }

    loadCourses();
  }, []);

  async function loadPreview(
    courseId: string
  ) {
    if (
      previewUrls[courseId] ||
      previewLoading[courseId]
    ) {
      return;
    }

    setPreviewLoading(
      (current) => ({
        ...current,
        [courseId]: true,
      })
    );

    setPreviewErrors(
      (current) => ({
        ...current,
        [courseId]: "",
      })
    );

    const supabase =
      createClient();

    const { data } =
      await supabase.auth.getSession();

    const token =
      data.session
        ?.access_token;

    if (!token) {
      setPreviewErrors(
        (current) => ({
          ...current,
          [courseId]:
            "Your session expired. Please sign in again.",
        })
      );

      setPreviewLoading(
        (current) => ({
          ...current,
          [courseId]: false,
        })
      );

      return;
    }

    const response =
      await fetch(
        `/api/r2/course-preview-url?courseId=${encodeURIComponent(
          courseId
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    const result =
      await response.json();

    if (response.ok) {
      setPreviewUrls(
        (current) => ({
          ...current,
          [courseId]: result.videoUrl,
        })
      );
      setPreviewSeconds((current) => ({
        ...current,
        [courseId]: typeof result.previewSeconds === "number" ? result.previewSeconds : null,
      }));
    } else {
      setPreviewErrors(
        (current) => ({
          ...current,
          [courseId]:
            result.error ||
            "Video preview is unavailable.",
        })
      );
    }

    setPreviewLoading(
      (current) => ({
        ...current,
        [courseId]: false,
      })
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pt-6 pb-10">
      <div className="text-sm text-cyan-300">
        Training Library
      </div>

      <h1 className="mt-1 text-4xl font-bold">
        Security Awareness Courses
      </h1>

      <p className="mt-2 text-slate-400">
        Preview the actual training content your employees will receive. Company administrators can assign courses, while only the platform owner can edit them.
      </p>

      {!hasSubscriptionAccess ? (
        <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          Your subscription is inactive. You can still preview the first 60 seconds of each training video. {" "}
          <Link href="/account#billing" className="font-semibold underline">Subscribe to unlock full videos.</Link>
        </div>
      ) : null}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {courses.map(
          (course) => {
            const previewUrl =
              previewUrls[
                course.id
              ];

            const previewError =
              previewErrors[
                course.id
              ];

            const loading =
              previewLoading[
                course.id
              ];

            const hasVideo =
              Boolean(
                course.video_key ||
                  course.video_url
              );

            return (
              <article
                key={
                  course.id
                }
                className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
              >
                <div className="bg-slate-950">
                  {previewUrl ? (
                    <video
                      controls
                      preload="metadata"
                      src={previewUrl}
                      onTimeUpdate={(event) => {
                        const limit = previewSeconds[course.id];
                        if (typeof limit === "number" && event.currentTarget.currentTime >= limit) {
                          event.currentTarget.pause();
                          event.currentTarget.currentTime = limit;
                        }
                      }}
                      onSeeking={(event) => {
                        const limit = previewSeconds[course.id];
                        if (typeof limit === "number" && event.currentTarget.currentTime > limit) {
                          event.currentTarget.currentTime = limit;
                        }
                      }}
                      className="aspect-video w-full bg-black"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="flex aspect-video items-center justify-center p-6 text-center">
                      {previewError ? (
                        <div className="max-w-sm text-sm text-rose-300">
                          {
                            previewError
                          }
                        </div>
                      ) : hasVideo ? (
                        <button
                          type="button"
                          onClick={() =>
                            loadPreview(
                              course.id
                            )
                          }
                          disabled={
                            loading
                          }
                          className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                        >
                          {loading
                            ? "Loading Video..."
                            : "Preview Video"}
                        </button>
                      ) : (
                        <div className="text-sm text-slate-500">
                          No video has been configured for this course.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-xl font-semibold">
                    {
                      course.title
                    }
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {
                      course.description
                    }
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                    <span>
                      {course.duration_minutes ??
                        "—"}{" "}
                      min
                    </span>

                    <span>
                      {course.quiz_question_count ??
                        0}{" "}
                      questions
                    </span>

                    <span>
                      Default pass{" "}
                      {course.passing_score ??
                        80}
                      %
                    </span>
                  </div>

                  {previewUrl ? (
                    <div className="mt-4 text-xs text-slate-500">
                      {previewSeconds[course.id] ? "60-second subscription preview — subscribe to watch the full course." : "Admin preview only — watching this video does not create or complete an employee assignment."}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          }
        )}

        {!courses.length ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-slate-400">
            No active training courses were found.
          </div>
        ) : null}
      </div>
    </main>
  );
}
