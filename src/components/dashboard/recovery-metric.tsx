"use client";

import React from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecoveryMetricProps {
  amount?: number;
  displayAmount?: string;
  trendPercent?: number;
  className?: string;
}

export function RecoveryMetric({
  amount,
  displayAmount = "₹4.8L",
  trendPercent = 12.4,
  className,
}: RecoveryMetricProps) {
  const formattedValue = React.useMemo(() => {
    if (displayAmount) return displayAmount;
    if (amount !== undefined && amount !== null) {
      const inRupees = amount / 100;
      if (inRupees >= 100000) {
        return `₹${(inRupees / 100000).toFixed(1)}L`;
      }
      return `₹${inRupees.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;
    }
    return "₹4.8L";
  }, [amount, displayAmount]);

  return (
    <div
      className={cn(
        "bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between hover:bg-white dark:hover:bg-slate-850 transition-colors duration-150 shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Total Recovered
        </span>
        <div className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800 font-mono">
          <ChevronUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          <span>+{trendPercent}%</span>
        </div>
      </div>

      <div className="my-1.5 flex items-baseline gap-2">
        <span className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-slate-950 dark:text-white font-mono tabular-nums leading-none">
          {formattedValue}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
        Auto-represented chargebacks won through evidence sync.
      </p>
    </div>
  );
}
