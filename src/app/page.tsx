import Link from "next/link";
import { getHomepageSettings } from "@/lib/homepage-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getHomepageSettings();
  const stats = settings.stats.filter((stat) => stat.enabled);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.10),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
              {settings.heroBadge}
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {settings.heroBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Sign In to Training
              </Link>
              <Link
                href="/training"
                className="rounded-lg border border-white/15 px-5 py-3 font-semibold hover:bg-white/5"
              >
                View Training Topics
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            {settings.playbackUrl ? (
              <video
                key={settings.playbackUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black object-contain"
              >
                <source src={settings.playbackUrl} />
                Your browser does not support HTML5 video.
              </video>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-slate-950 px-8 text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-2xl text-cyan-300">
                    ▶
                  </div>
                  <div className="mt-5 text-xl font-semibold">Homepage video</div>
                  <p className="mt-2 text-sm text-slate-400">
                    Add your promotional video from Platform Admin.
                  </p>
                </div>
              </div>
            )}
            <div className="border-t border-white/10 px-5 py-4">
              <div className="font-semibold">{settings.videoTitle}</div>
              <div className="mt-1 text-sm text-slate-400">
                A short introduction to practical employee cybersecurity awareness.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900/55">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {settings.statsEyebrow}
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {settings.statsHeading}
            </h2>
            <p className="mt-4 text-slate-400">{settings.statsBody}</p>
          </div>

          {stats.length ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.id}
                  className="flex min-h-[285px] flex-col rounded-2xl border border-white/10 bg-slate-950/75 p-6"
                >
                  <div className="text-3xl font-black tracking-tight text-cyan-300 md:text-4xl">
                    {stat.value}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug">{stat.label}</h3>
                  {stat.detail ? (
                    <p className="mt-3 text-sm leading-6 text-slate-400">{stat.detail}</p>
                  ) : null}
                  <div className="mt-auto pt-5 text-xs text-slate-500">
                    Source:{" "}
                    {stat.sourceUrl ? (
                      <a
                        href={stat.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-cyan-300"
                      >
                        {stat.source}
                      </a>
                    ) : (
                      <span className="text-slate-300">{stat.source}</span>
                    )}
                    {stat.sourceDate ? ` · ${stat.sourceDate}` : ""}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Phishing", "Spot suspicious senders, links, login requests, attachments, and social-engineering tactics."],
              ["Passwords", "Build stronger password habits, use password managers, and understand multi-factor authentication."],
              ["Remote Work", "Protect company accounts and devices while working remotely or using public Wi-Fi."],
              ["Company Data", "Understand how everyday mistakes can expose sensitive company and customer information."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-xl font-semibold">{title}</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] px-8 py-10 text-center md:px-12">
            <h2 className="text-3xl font-bold">Simple training. Better security habits.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Invite employees, assign training, add quizzes, track completion, and keep security awareness moving forward.
            </p>
            <Link
              href="/login"
              className="mt-7 inline-flex rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
