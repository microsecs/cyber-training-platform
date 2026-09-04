import Link from "next/link";
import { getHomepageSettings } from "@/lib/homepage-settings";

export const dynamic = "force-dynamic";

const benefits = [
  {
    title: "Unlimited Employees",
    body: "Train your entire team for one flat monthly subscription with no per-employee training fee.",
  },
  {
    title: "Track Completion",
    body: "Assign courses, use quizzes, and see who has completed training from one simple dashboard.",
  },
  {
    title: "Practical Training",
    body: "Clear lessons covering phishing, passwords, remote work, public Wi-Fi, company data, and more.",
  },
];

export default async function Home() {
  const settings = await getHomepageSettings();
  const stats = settings.stats.filter((stat) => stat.enabled);
  const ctaIsExternal = /^https?:\/\//i.test(settings.ctaUrl);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.12),transparent_42%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-12 text-center md:py-16 lg:py-20">
          <div className="mx-auto inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            {settings.heroBadge}
          </div>

          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Employee Cybersecurity Training Made Simple
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Straightforward cybersecurity training that helps employees recognize threats, protect passwords, work securely, and keep company information safe.
          </p>

          <div className="mt-7 text-2xl font-bold tracking-tight text-white md:text-3xl">
            One subscription. Unlimited employees.
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-cyan-300 md:text-4xl">
            {settings.subscriptionPrice}
            <span className="ml-2 text-base font-medium text-slate-400 md:text-lg">per month</span>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
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

          <p className="mt-4 text-sm text-slate-500">
            Track assignments, quizzes, and completion from one simple dashboard.
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-5 py-10 md:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              {settings.statsEyebrow}
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {settings.statsHeading}
            </h2>
          </div>

          {stats.length ? (
            <div className="mt-8 grid gap-y-8 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-11 md:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Everything you need
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Train your team without making security complicated.
            </h2>
          </div>

          <div className="mt-9 grid gap-8 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className={`text-center md:px-6 ${index > 0 ? "md:border-l md:border-white/10" : ""}`}
              >
                <div className="text-lg font-semibold text-white">{benefit.title}</div>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900/35">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-11 md:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              See the training
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Preview the actual courses your employees will receive.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Browse the training library and preview course videos before subscribing. Employers without an active subscription can watch the first 20 seconds of available training videos.
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

      <section id="subscribe">
        <div className="mx-auto max-w-5xl px-5 py-11 md:py-14">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.055] px-6 py-8 text-center md:px-10 md:py-10">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              {settings.pricingEyebrow}
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {settings.pricingHeading}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              {settings.pricingBody}
            </p>

            <div className="mt-6 text-4xl font-black tracking-tight text-cyan-300">
              {settings.subscriptionPrice}
            </div>
            <div className="mt-1 text-sm text-slate-400">per month · unlimited employees included</div>

            <a
              href={settings.ctaUrl}
              target={ctaIsExternal ? "_blank" : undefined}
              rel={ctaIsExternal ? "noreferrer" : undefined}
              className="mt-6 inline-block rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              {settings.ctaLabel}
            </a>

            <div className="mt-4 text-xs text-slate-500">
              Have a promotional code? Apply it during checkout.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
