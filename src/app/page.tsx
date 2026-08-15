import Link from "next/link";

const courses = [
  { title: "Phishing Awareness", length: "6 min", status: "Required" },
  { title: "Password Security", length: "5 min", status: "Required" },
  { title: "Business Email Compromise", length: "8 min", status: "Recommended" },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
            Security training built for real businesses
          </div>
          <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Train your team to recognize cyber threats before they become incidents.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            One company subscription. Invite employees, assign training, track completion,
            and keep your organization security-aware.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/admin" className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              View Admin Dashboard
            </Link>
            <Link href="/employee" className="rounded-lg border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">
              View Employee Dashboard
            </Link>
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
                  <Link href="/training" className="text-sm text-cyan-300">View</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Prototype V2</div>
            <h2 className="mt-3 text-3xl font-bold">Now with working page navigation.</h2>
            <p className="mt-4 text-slate-400">
              Explore the admin dashboard, employee management, training library, and employee experience.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
