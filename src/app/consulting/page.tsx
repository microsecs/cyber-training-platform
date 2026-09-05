import Link from "next/link";

export const metadata = { title: "Computer Consulting | MicroSECONDS" };

export default function ConsultingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 md:p-10">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">MicroSECONDS</div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Computer Consulting</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          Practical IT consulting, support, networking, cloud services, security, and technology solutions for businesses.
        </p>
        <p className="mt-5 max-w-3xl leading-7 text-slate-400">
          This section is being expanded. For consulting assistance now, visit Support or email support@microseconds.com.
        </p>
        <Link href="/support" className="mt-7 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
          Contact MicroSECONDS Support
        </Link>
      </div>
    </main>
  );
}
