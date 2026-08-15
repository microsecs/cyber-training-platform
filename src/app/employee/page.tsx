import ProgressBar from "@/components/ProgressBar";

const assignments = [
  ["Phishing Awareness", "Due Aug 20", 100, "Completed"],
  ["Password Security", "Due Aug 22", 65, "In Progress"],
  ["Business Email Compromise", "Due Aug 28", 0, "Not Started"],
];

export default function EmployeePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
        <div className="text-sm text-cyan-300">Employee Portal</div>
        <h1 className="mt-1 text-4xl font-bold">Welcome back, Maria</h1>
        <p className="mt-2 text-slate-400">You have 2 training items remaining.</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          ["Assigned", "3"],
          ["Completed", "1"],
          ["Overall Progress", "55%"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">My Training</h2>
        <div className="mt-5 space-y-4">
          {assignments.map(([name, due, progress, status]) => (
            <div key={name as string} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold">{name}</div>
                  <div className="mt-1 text-sm text-slate-400">{due}</div>
                </div>
                <button className="rounded-lg bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950">
                  {status === "Completed" ? "Review" : status === "In Progress" ? "Continue" : "Start Training"}
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{status}</span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar value={progress as number} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
