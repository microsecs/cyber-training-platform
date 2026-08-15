import Link from "next/link";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";

const activity = [
  "Maria completed Phishing Awareness",
  "James was assigned Password Security",
  "Invitation sent to alex@abcplumbing.com",
  "Derrick completed Business Email Compromise",
];

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-cyan-300">ABC Plumbing</div>
          <h1 className="mt-1 text-4xl font-bold">Company Admin Dashboard</h1>
          <p className="mt-2 text-slate-400">Manage employees, training assignments, and company progress.</p>
        </div>
        <Link href="/employees" className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
          Invite Employees
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees" value="17 / 25" detail="8 seats available" />
        <StatCard label="Completion Rate" value="82%" detail="+6% this month" />
        <StatCard label="Overdue Training" value="3" detail="Needs attention" />
        <StatCard label="Courses Assigned" value="4" detail="Across 17 employees" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Training Progress</h2>
              <p className="text-sm text-slate-400">Completion by assigned course</p>
            </div>
            <Link href="/training" className="text-sm text-cyan-300">Manage Training</Link>
          </div>

          <div className="mt-6 space-y-6">
            {[
              ["Phishing Awareness", 94],
              ["Password Security", 82],
              ["Business Email Compromise", 71],
              ["Safe Web Browsing", 65],
            ].map(([name, percent]) => (
              <div key={name as string}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-slate-400">{percent}%</span>
                </div>
                <ProgressBar value={percent as number} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div key={item} className="border-b border-white/10 pb-4 text-sm text-slate-300 last:border-0">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
