"use client";

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 md:p-10">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Contact
        </div>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
          How can we help?
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          For questions about MicroSECONDS Employee Security Training,
          subscriptions, billing, employee access, or technical support, contact
          us by email.
        </p>

        <div className="mt-8 rounded-xl border border-white/10 bg-slate-950 p-6">
          <div className="text-sm text-slate-400">Support Email</div>
          <a
            href="mailto:support@microseconds.com"
            className="mt-2 inline-block text-xl font-semibold text-cyan-300 hover:text-cyan-200"
          >
            support@microseconds.com
          </a>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Please include your company name and the email address associated
            with your account when requesting account or billing assistance.
          </p>
        </div>
      </div>
    </main>
  );
}
