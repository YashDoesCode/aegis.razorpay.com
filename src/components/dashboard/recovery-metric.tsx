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
        "bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:bg-white transition-colors duration-150 shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Total Recovered
        </span>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
          <ChevronUp className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
          <span>+{trendPercent}%</span>
        </div>
      </div>

      <div className="my-2 flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 font-mono tabular-nums">
          {formattedValue}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Auto-represented chargebacks won through evidence sync.
      </p>
    </div>
  );
}
