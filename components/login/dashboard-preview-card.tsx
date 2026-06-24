type MetricBlockProps = {
  label: string;
  value: string;
  suffix?: string;
  valueClassName?: string;
};

function MetricBlock({
  label,
  value,
  suffix,
  valueClassName,
}: MetricBlockProps) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold leading-none tracking-tight tabular-nums text-slate-900 ${valueClassName ?? ""}`}
      >
        {value}
        {suffix ? (
          <span className="ml-1.5 text-sm font-medium text-slate-500">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function DashboardPreviewCard({ className }: { className?: string }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_40px_-24px_rgba(74,74,74,0.12)] backdrop-blur-sm transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-kefoo-200 hover:shadow-[0_12px_48px_-20px_rgba(74,74,74,0.18)] ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-kefoo-50/80 via-white to-transparent"
        aria-hidden
      />

      <div className="relative">
        <div className="mb-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Campaign Progress
              </p>
              <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-slate-900">
                87%
                <span className="ml-2 text-base font-medium text-slate-500">
                  Complete
                </span>
              </p>
            </div>
          </div>

          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80"
            role="progressbar"
            aria-valuenow={87}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Campaign progress"
          >
            <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-kefoo-300 via-kefoo-500 to-kefoo-600 shadow-[0_0_12px_rgba(74,74,74,0.35)] transition-all duration-500 group-hover:w-[87%]" />
          </div>
        </div>

        <div className="space-y-6 border-t border-slate-200/80 pt-6">
          <MetricBlock label="Scheduled Content" value="127" suffix="Posts" />
          <MetricBlock label="Active Creators" value="48" suffix="Creators" />
          <MetricBlock
            label="Performance Growth"
            value="+32%"
            valueClassName="text-emerald-600"
          />
        </div>
      </div>
    </div>
  );
}
