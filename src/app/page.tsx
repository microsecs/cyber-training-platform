export default function Home() {
  const courses = [
    { title: "Phishing Awareness", length: "6 min", status: "Required" },
    { title: "Password Security", length: "5 min", status: "Required" },
    { title: "Business Email Compromise", length: "8 min", status: "Recommended" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-xl font-bold tracking-tight">CyberAware</div>
            <div className="text-xs text-slate-400">Employee Security Training</div>
          </div>
          <nav className="hidden gap-7 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#training" className="hover:text-white">Training</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </nav>
          <button className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5">
            Sign In
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
            Security training built for real businesses
          </div>
          <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Train your team to recognize cyber threats before they become incidents.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            One company subscription. Invite your employees, assign short training,
            track completion, and keep your organization security-aware.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Start Free Trial
            </button>
            <button className="rounded-lg border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">
              View Training
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
            <span>✓ No employee subscriptions</span>
            <span>✓ Admin-managed seats</span>
            <span>✓ Completion tracking</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">Company Dashboard</div>
              <div className="text-sm text-slate-400">ABC Plumbing</div>
            </div>
            <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
              Active Plan
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Employees", "17 / 25"],
              ["Training Complete", "82%"],
              ["Overdue", "3"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <div className="text-sm text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-bold">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-slate-900 p-4">
            <div className="mb-3 font-medium">Current Training</div>
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.title} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div>
                    <div className="font-medium">{course.title}</div>
                    <div className="text-xs text-slate-400">{course.length} • {course.status}</div>
                  </div>
                  <div className="text-sm text-cyan-300">View</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Built for employers</div>
            <h2 className="mt-3 text-3xl font-bold">Simple enough to manage. Serious enough to matter.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["Invite Your Team", "Add employees by email and manage everyone under one company subscription."],
              ["Assign Training", "Send required courses to everyone or selected users and set due dates."],
              ["Track Completion", "See who completed training, who is overdue, and how your company is progressing."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-slate-950 p-6">
                <div className="text-lg font-semibold">{title}</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="training" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Training Library</div>
            <h2 className="mt-3 text-3xl font-bold">Short lessons employees will actually finish.</h2>
          </div>
          <div className="text-sm text-slate-400">More courses added regularly</div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {courses.map((course, i) => (
            <div key={course.title} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-cyan-300">
                  ▶ Training Video
                </div>
              </div>
              <div className="p-5">
                <div className="text-lg font-semibold">{course.title}</div>
                <div className="mt-2 text-sm text-slate-400">{course.length} • Quiz included</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Pricing</div>
            <h2 className="mt-3 text-3xl font-bold">One subscription for the entire company.</h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {[
              ["Starter", "$39", "Up to 10 employees"],
              ["Business", "$99", "Up to 50 employees"],
              ["Professional", "$199", "Up to 150 employees"],
            ].map(([name, price, seats], idx) => (
              <div key={name} className={`rounded-2xl border p-6 ${idx === 1 ? "border-cyan-400 bg-cyan-400/5" : "border-white/10 bg-slate-950"}`}>
                <div className="text-lg font-semibold">{name}</div>
                <div className="mt-4 text-4xl font-bold">{price}<span className="text-base font-normal text-slate-400">/mo</span></div>
                <div className="mt-2 text-sm text-slate-400">{seats}</div>
                <button className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold ${idx === 1 ? "bg-cyan-400 text-slate-950" : "border border-white/15"}`}>
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        Prototype cybersecurity training platform
      </footer>
    </main>
  );
}
