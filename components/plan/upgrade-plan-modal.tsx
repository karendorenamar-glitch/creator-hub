"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { UPGRADE_PLAN_MESSAGE } from "@/lib/plan";

type UpgradePlanModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  checkoutHref?: string;
};

export function UpgradePlanModal({
  open,
  onClose,
  title = "Upgrade your plan",
  description = UPGRADE_PLAN_MESSAGE,
  checkoutHref = "/checkout/growth",
}: UpgradePlanModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600">
          Free trial includes up to 3 campaigns, 10 creators, and 15 tracked
          videos with basic campaign analytics.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Keep exploring
          </button>
          <Link
            href={checkoutHref}
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300"
          >
            View upgrade options
          </Link>
        </div>
      </div>
    </Modal>
  );
}
