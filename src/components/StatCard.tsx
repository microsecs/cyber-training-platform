export default function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {detail ? <div className="mt-2 text-xs text-slate-500">{detail}</div> : null}
    </div>
  );
}
