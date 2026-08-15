const employees = [
  ["Maria Lopez", "maria@abcplumbing.com", "100%", "Current"],
  ["James Hall", "james@abcplumbing.com", "75%", "Current"],
  ["Derrick Brown", "derrick@abcplumbing.com", "88%", "Current"],
  ["Alex Carter", "alex@abcplumbing.com", "—", "Invited"],
  ["Sarah Kim", "sarah@abcplumbing.com", "50%", "Overdue"],
];

export default function EmployeesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-cyan-300">Company Admin</div>
          <h1 className="mt-1 text-4xl font-bold">Employees</h1>
          <p className="mt-2 text-slate-400">Invite users and monitor training status.</p>
        </div>
        <button className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
          + Invite Employee
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="grid grid-cols-[1.2fr_1.6fr_.7fr_.7fr] gap-4 border-b border-white/10 bg-white/5 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <div>Name</div>
          <div>Email</div>
          <div>Completion</div>
          <div>Status</div>
        </div>

        {employees.map(([name, email, completion, status]) => (
          <div key={email} className="grid grid-cols-[1.2fr_1.6fr_.7fr_.7fr] gap-4 border-b border-white/10 px-5 py-4 text-sm last:border-0">
            <div className="font-medium">{name}</div>
            <div className="text-slate-400">{email}</div>
            <div>{completion}</div>
            <div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${
                status === "Current"
                  ? "bg-emerald-400/10 text-emerald-300"
                  : status === "Overdue"
                  ? "bg-rose-400/10 text-rose-300"
                  : "bg-amber-400/10 text-amber-300"
              }`}>
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Invite Employees</h2>
        <p className="mt-2 text-sm text-slate-400">
          This is a prototype form. In the Supabase version, this will email a real invitation.
        </p>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
            placeholder="employee@company.com"
          />
          <button className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
            Send Invitation
          </button>
        </div>
      </section>
    </main>
  );
}
