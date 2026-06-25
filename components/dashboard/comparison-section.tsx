import type { ReactNode } from "react";

type ComparisonSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ComparisonSection({
  title,
  description,
  children,
}: ComparisonSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
