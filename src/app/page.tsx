import Link from "next/link";

function ProductVideo({ src, label }: { src?: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
      <div className="aspect-video bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.13),transparent_40%),linear-gradient(145deg,rgba(15,23,42,1),rgba(2,6,23,1))]">
        {src ? (
          <video className="h-full w-full object-cover" controls preload="metadata" playsInline>
            <source src={src} />
            Your browser does not support embedded video.
          </video>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-2xl text-cyan-300">▶</div>
            <div className="mt-4 text-lg font-bold">{label}</div>
            <div className="mt-1 text-sm text-slate-400">Video coming soon</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const trainingVideo = process.env.NEXT_PUBLIC_TRAINING_PROMO_VIDEO || "";
  const monitoringVideo = process.env.NEXT_PUBLIC_MONITORING_PROMO_VIDEO || "";

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_82%_25%,rgba(59,130,246,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-[88rem] px-4 py-10 text-center sm:px-5 md:py-12 lg:px-6">
          <div className="mx-auto inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-300">Practical cybersecurity for real businesses</div>
          <h1 className="mx-auto mt-4 max-w-5xl text-4xl font-black tracking-tight md:text-6xl">Train Your People. <span className="text-cyan-300">Monitor Your Accounts.</span></h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Practical cybersecurity solutions from MicroSECONDS.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/employee-security-training" className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Explore Training</Link>
            <Link href="/monitoring" className="rounded-lg border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">Explore Monitoring</Link>
          </div>
        </div>
      </section>

      <section id="training" className="border-b border-white/10 bg-slate-900/40">
        <div className="mx-auto grid max-w-[88rem] gap-7 px-4 py-9 sm:px-5 md:py-11 lg:px-6 lg:grid-cols-2 lg:items-center">
          <ProductVideo src={trainingVideo} label="MicroSECONDS Training" />
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">MicroSECONDS Training</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Employee Security Training Made Simple.</h2>
            <p className="mt-3 leading-7 text-slate-300">Train unlimited employees for one flat subscription. Assign lessons, optionally quiz employees, track completion and help your workforce recognize real-world cybersecurity threats.</p>
            <p className="mt-3 font-semibold text-slate-200">Phishing • Passwords • Remote Work • Public Wi-Fi • Data Security • More</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/employee-security-training" className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Learn More</Link>
              <Link href="/login" className="rounded-lg border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">Training Login</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="monitoring" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[88rem] gap-7 px-4 py-9 sm:px-5 md:py-11 lg:px-6 lg:grid-cols-2 lg:items-center">
          <div className="lg:order-1">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">MicroSECONDS Monitoring</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Monitor Every Client. From One Place.</h2>
            <p className="mt-3 leading-7 text-slate-300">Monitor Microsoft 365 and Google Workspace sign-ins across multiple customer tenants. Identify suspicious activity, investigate incidents and get alerted when something deserves attention.</p>
            <p className="mt-3 font-semibold text-slate-200">Built for IT Consultants • MSPs • Internal IT Teams</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/monitoring" className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Explore Monitoring</Link>
              <span className="rounded-lg border border-white/10 px-5 py-3 font-semibold text-slate-500">Monitoring Login — Coming Soon</span>
            </div>
          </div>
          <div className="lg:order-2"><ProductVideo src={monitoringVideo} label="MicroSECONDS Monitoring" /></div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-11 text-center sm:px-5 md:py-12 lg:px-6">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Built From Real-World IT Experience</div>
          <h2 className="mt-2 text-3xl font-bold">40+ Years Working With Business Technology.</h2>
          <p className="mx-auto mt-2 max-w-3xl leading-7 text-slate-400">MicroSECONDS Training and Monitoring are designed around the security problems businesses and IT professionals actually encounter.</p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[88rem] px-4 py-8 sm:px-5 md:py-9 lg:px-6">
          <div className="text-center"><div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">More from MicroSECONDS</div></div>
          <div className="mx-auto mt-4 grid max-w-5xl gap-4 md:grid-cols-2">
            <Link href="/easydesktop" className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 transition hover:border-cyan-300/30 hover:bg-slate-900"><h3 className="text-xl font-bold">EasyDesktop</h3><p className="mt-2 text-sm leading-6 text-slate-400">Making everyday computing easier.</p><div className="mt-3 font-semibold text-cyan-300">Learn More →</div></Link>
            <Link href="/consulting" className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 transition hover:border-cyan-300/30 hover:bg-slate-900"><h3 className="text-xl font-bold">IT Consulting</h3><p className="mt-2 text-sm leading-6 text-slate-400">Experienced hands-on IT services when you need them.</p><div className="mt-3 font-semibold text-cyan-300">Learn More →</div></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
