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
  trendPercent = 18.2,
  className,
}: RecoveryMetricProps) {
  const formattedValue = React.useMemo(() => {
    if (displayAmount) return displayAmount;
    if (amount !== undefined && amount !== null) {
      const inRupees = amount / 100;
      if (inRupees >= 100000) {
        return `₹${(inRupees / 100000).toFixed(2)}L`;
      }
      return `₹${inRupees.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;
    }
    return "₹4.83L";
  }, [amount, displayAmount]);

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 sm:p-4.5 flex flex-col justify-between transition-colors duration-150 shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Recovered
        </span>
        <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono">
          <ChevronUp className="w-3.5 h-3.5 stroke-[2]" />
          <span>+{trendPercent}%</span>
        </div>
      </div>

      <div className="my-1.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground font-mono tabular-nums leading-none">
          {formattedValue}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        Representments defended through automated evidence sync.
      </p>
    </div>
  );
}
