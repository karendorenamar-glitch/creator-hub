type InsightCardProps = {
  label: string;
  name: string;
  detail: string;
  meta?: string;
};

export function InsightCard({ label, name, detail, meta }: InsightCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 truncate text-base font-semibold text-slate-900">
        {name}
      </p>
      <p className="mt-1 text-sm font-medium text-kefoo-600">{detail}</p>
      {meta && <p className="mt-1 truncate text-xs text-slate-500">{meta}</p>}
    </article>
  );
}
