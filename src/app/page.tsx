import Link from "next/link";
import { getHomepageSettings } from "@/lib/homepage-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getHomepageSettings();
  const stats = settings.stats.filter((stat) => stat.enabled);
  const ctaIsExternal = /^https?:\/\//i.test(settings.ctaUrl);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(59,130,246,0.09),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-5 py-8 md:py-9 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-10">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              {settings.heroBadge}
            </div>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-[3.35rem]">
              Employee Cybersecurity Training Made Simple
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              Straightforward cybersecurity training that helps employees recognize threats, protect passwords, work securely, and keep company information safe.
            </p>

            <div className="mt-5 text-2xl font-bold tracking-tight text-white md:text-3xl">
              One subscription. Unlimited employees.
            </div>
            <div className="mt-1 text-3xl font-black tracking-tight text-cyan-300 md:text-4xl">
              {settings.subscriptionPrice}
              <span className="ml-2 text-base font-medium text-slate-400 md:text-lg">per month</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={settings.ctaUrl}
                target={ctaIsExternal ? "_blank" : undefined}
                rel={ctaIsExternal ? "noreferrer" : undefined}
                className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                {settings.ctaLabel}
              </a>
              <Link
                href="/training"
                className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5"
              >
                Preview Training
              </Link>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Track assignments, quizzes, and completion from one simple dashboard.
            </p>
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xl text-cyan-300">
                    ▶
                  </div>
                  <div className="mt-4 text-lg font-semibold">Homepage video</div>
                  <p className="mt-1 text-sm text-slate-400">
                    Add your promotional video from Platform Admin.
                  </p>
                </div>
              </div>
            )}
            <div className="border-t border-white/10 px-4 py-3 md:px-5">
              <div className="font-semibold">{settings.videoTitle}</div>
              <div className="mt-0.5 text-xs text-slate-400 md:text-sm">
                A short introduction to practical employee cybersecurity awareness.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-5 py-7 md:py-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              {settings.statsEyebrow}
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {settings.statsHeading}
            </h2>
          </div>

          {stats.length ? (
            <div className="mt-6 grid gap-y-6 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <article
                  key={stat.id}
                  className={`px-5 text-center ${index > 0 ? "md:border-l md:border-white/10" : ""}`}
                >
                  <div className="text-3xl font-black tracking-tight text-cyan-300 md:text-4xl">
                    {stat.value}
                  </div>
                  <h3 className="mx-auto mt-2 max-w-xs text-sm font-semibold leading-5 text-slate-200">
                    {stat.label}
                  </h3>
                  <div className="mt-2 text-xs text-slate-500">
                    Source:{" "}
                    {stat.sourceUrl ? (
                      <a
                        href={stat.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 underline decoration-white/20 underline-offset-4 hover:text-cyan-300"
                      >
                        {stat.source}
                      </a>
                    ) : (
                      <span className="text-slate-400">{stat.source}</span>
                    )}
                    {stat.sourceDate ? ` · ${stat.sourceDate}` : ""}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900/35">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 md:py-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              See the training
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Preview the actual courses your employees will receive.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Browse the training library and preview course videos before subscribing. Employers without an active subscription can watch the first 60 seconds of available training videos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/training"
              className="rounded-lg bg-cyan-400 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Preview Training
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/15 px-5 py-3 text-center font-semibold hover:bg-white/5"
            >
              Existing Customer Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
