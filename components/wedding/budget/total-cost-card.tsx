"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/wedding/ui";
import { formatIDR } from "@/lib/wedding/format";
import type { ModuleCopy } from "@/lib/wedding/module-copy";

export function TotalCostCard({
  totalCost,
  vendorBudget,
  otherCostsTotal,
  copy,
}: {
  totalCost: number;
  vendorBudget: number;
  otherCostsTotal: number;
  copy: ModuleCopy;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="total-cost-details"
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#888176]">
            {copy.budget.totalCost}
          </span>
          <span className="mt-2 block font-heading text-2xl text-[#49463F]">
            {formatIDR(totalCost)}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#888176] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <div
        id="total-cost-details"
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 space-y-2 border-t border-[#EAE0D7] pt-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#49463F]">{copy.budget.vendorBudget}</span>
              <span className="font-medium text-[#49463F]">
                {formatIDR(vendorBudget)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#49463F]">
                {copy.budget.otherCostsTotal}
              </span>
              <span className="font-medium text-[#49463F]">
                {formatIDR(otherCostsTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
