import type { DerivedPaymentStatus } from "@/lib/wedding/budget-calc";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

function labelFor(status: DerivedPaymentStatus, copy: ModuleCopy) {
  switch (status) {
    case "dp":
      return copy.vendors.statusDp;
    case "termin_lanjutan":
      return copy.vendors.statusTerminLanjutan;
    case "lunas":
      return copy.vendors.statusLunas;
    case "incomplete":
      return copy.vendors.statusIncomplete;
    default:
      return copy.vendors.statusDiskusi;
  }
}

const toneClass: Record<DerivedPaymentStatus, string> = {
  diskusi: "border-amber-200 bg-amber-100 text-amber-950",
  dp: "border-sky-200 bg-sky-100 text-sky-950",
  termin_lanjutan: "border-sky-300 bg-sky-100 text-sky-950",
  lunas: "border-emerald-200 bg-emerald-100 text-emerald-950",
  incomplete: "border-stone-300 bg-stone-100 text-stone-800",
};

export function PaymentStatusBadge({
  status,
  copy,
  className = "",
}: {
  status: DerivedPaymentStatus;
  copy: ModuleCopy;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[status]} ${className}`}
      aria-label={`${copy.vendors.paymentStatus}: ${labelFor(status, copy)}`}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-current opacity-70"
      />
      {labelFor(status, copy)}
    </span>
  );
}
