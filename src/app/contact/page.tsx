export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Contact MicroSECONDS</h1>
      <p className="mt-5 max-w-2xl leading-7 text-slate-300">
        Need help with your account, subscription, or employee cybersecurity training? Contact MicroSECONDS Computer Consulting for assistance.
      </p>
      <a
        href="mailto:training@microseconds.com"
        className="mt-6 inline-flex rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
      >
        training@microseconds.com
      </a>
    </main>
  );
}
