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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.10),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-4 px-4 py-5 md:px-5 md:py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch lg:py-7">
          <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:p-5">
            <div className="mb-2 inline-flex w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
              {settings.heroBadge}
            </div>
            <h1 className="max-w-3xl text-3xl font-bold leading-[1.06] tracking-tight md:text-4xl lg:text-[2.65rem]">
              {settings.heroTitle}
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              {settings.heroBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <a
                href={settings.ctaUrl}
                target={ctaIsExternal ? "_blank" : undefined}
                rel={ctaIsExternal ? "noreferrer" : undefined}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                {settings.ctaLabel}
              </a>
              <Link
                href="/login"
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Existing Customer Sign In
              </Link>
            </div>

            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-white/10 pt-3.5">
              <div>
                <div className="text-lg font-black tracking-tight text-cyan-300">{settings.experienceValue}</div>
                <div className="mt-0.5 text-xs leading-4 text-slate-400">{settings.experienceLabel}</div>
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-cyan-300">{settings.subscriptionValue}</div>
                <div className="mt-0.5 text-xs leading-4 text-slate-400">{settings.subscriptionLabel}</div>
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-cyan-300">{settings.subscriptionPrice}</div>
                <div className="mt-0.5 text-xs leading-4 text-slate-400">{settings.subscriptionPeriod}</div>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xl text-cyan-300">▶</div>
                  <div className="mt-4 text-lg font-semibold">Homepage video</div>
                  <p className="mt-1 text-sm text-slate-400">Add your promotional video from Platform Admin.</p>
                </div>
              </div>
            )}
            <div className="border-t border-white/10 px-4 py-2.5 md:px-5">
              <div className="font-semibold">{settings.videoTitle}</div>
              <div className="mt-0.5 text-xs text-slate-400 md:text-sm">A short introduction to practical employee cybersecurity awareness.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900/55">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-5 md:py-9">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">{settings.statsEyebrow}</div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{settings.statsHeading}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400 md:text-base">{settings.statsBody}</p>
          </div>

          {stats.length ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article key={stat.id} className="flex min-h-[205px] flex-col rounded-2xl border border-white/10 bg-slate-950/75 p-4">
                  <div className="text-2xl font-black tracking-tight text-cyan-300 md:text-3xl">{stat.value}</div>
                  <h3 className="mt-3 font-semibold leading-snug">{stat.label}</h3>
                  {stat.detail ? <p className="mt-2 text-sm leading-5 text-slate-400">{stat.detail}</p> : null}
                  <div className="mt-auto pt-4 text-xs text-slate-500">
                    Source: {stat.sourceUrl ? (
                      <a href={stat.sourceUrl} target="_blank" rel="noreferrer" className="text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-cyan-300">{stat.source}</a>
                    ) : <span className="text-slate-300">{stat.source}</span>}
                    {stat.sourceDate ? ` · ${stat.sourceDate}` : ""}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-5 md:py-9">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Phishing", "Spot suspicious senders, links, login requests, attachments, and social-engineering tactics."],
              ["Passwords", "Build stronger password habits, use password managers, and understand multi-factor authentication."],
              ["Remote Work", "Protect company accounts and devices while working remotely or using public Wi-Fi."],
              ["Company Data", "Understand how everyday mistakes can expose sensitive company and customer information."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-lg font-semibold">{title}</div>
                <p className="mt-2 text-sm leading-5 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="subscribe" className="bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-5 md:py-9">
          <div className="grid overflow-hidden rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] lg:grid-cols-[1.35fr_0.65fr]">
            <div className="p-5 md:p-6 lg:p-7">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">{settings.pricingEyebrow}</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{settings.pricingHeading}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-300">{settings.pricingBody}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                <span>✓ Unlimited employees</span>
                <span>✓ Quizzes & completion tracking</span>
                <span>✓ Multiple security training topics</span>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t border-white/10 bg-slate-950/55 p-5 text-center md:p-6 lg:border-l lg:border-t-0">
              <div className="text-3xl font-black tracking-tight text-cyan-300">{settings.subscriptionPrice}</div>
              <div className="mt-2 text-sm font-medium text-slate-300">{settings.subscriptionPeriod}</div>
              <div className="mt-1 text-xs text-slate-500">{settings.subscriptionFinePrint}</div>
              <a
                href={settings.ctaUrl}
                target={ctaIsExternal ? "_blank" : undefined}
                rel={ctaIsExternal ? "noreferrer" : undefined}
                className="mt-5 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                {settings.ctaLabel}
              </a>
              <Link href="/login" className="mt-3 text-sm text-slate-400 hover:text-cyan-300">Already subscribed? Sign in</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
