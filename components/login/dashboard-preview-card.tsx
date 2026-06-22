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
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold leading-none tracking-tight tabular-nums text-white ${valueClassName ?? ""}`}
      >
        {value}
        {suffix ? (
          <span className="ml-1.5 text-sm font-medium text-slate-400">
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
      className={`group relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_0_60px_-20px_rgba(168,85,247,0.25)] backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_0_80px_-16px_rgba(168,85,247,0.35)] ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent"
        aria-hidden
      />

      <div className="relative">
        <div className="mb-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                Campaign Progress
              </p>
              <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-white">
                87%
                <span className="ml-2 text-base font-medium text-slate-400">
                  Complete
                </span>
              </p>
            </div>
          </div>

          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10"
            role="progressbar"
            aria-valuenow={87}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Campaign progress"
          >
            <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-[#6EA5F7] to-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.45)] transition-all duration-500 group-hover:w-[87%]" />
          </div>
        </div>

        <div className="space-y-6 border-t border-white/10 pt-6">
          <MetricBlock label="Scheduled Content" value="127" suffix="Posts" />
          <MetricBlock label="Active Creators" value="48" suffix="Creators" />
          <MetricBlock
            label="Performance Growth"
            value="+32%"
            valueClassName="text-emerald-400"
          />
        </div>
      </div>
    </div>
  );
}
