"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface OperationalMetricsProps {
  openQueueCount?: number;
  highRiskCount?: number;
  wonCount?: number;
  winRatePercent?: number;
  evidenceGapsCount?: number;
  className?: string;
}

export function OperationalMetricGrid({
  openQueueCount = 128,
  highRiskCount = 23,
  wonCount = 91,
  winRatePercent = 71,
  evidenceGapsCount = 17,
  className,
}: OperationalMetricsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5 sm:gap-3 flex-1", className)}>
      <Link
        href="/disputes"
        className="bg-card rounded-xl p-3 sm:p-3.5 border border-border flex flex-col justify-between hover:bg-muted/40 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Open Queue
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>
        <div>
          <p className="text-xl font-semibold font-mono text-foreground tabular-nums leading-tight">
            {openQueueCount}
          </p>
          <span className="text-[11px] text-muted-foreground">
            Active resolution
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=high_risk"
        className="bg-card rounded-xl p-3 sm:p-3.5 border border-border flex flex-col justify-between hover:bg-muted/40 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            High-Risk
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        </div>
        <div>
          <p className="text-xl font-semibold font-mono text-foreground tabular-nums leading-tight">
            {highRiskCount}
          </p>
          <span className="inline-block text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-border">
            SLA &lt; 24h
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=won"
        className="bg-card rounded-xl p-3 sm:p-3.5 border border-border flex flex-col justify-between hover:bg-muted/40 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Won Ratio
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <div>
          <p className="text-xl font-semibold font-mono text-foreground tabular-nums leading-tight">
            {wonCount}
          </p>
          <span className="inline-block text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono border border-border">
            {winRatePercent}% win rate
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=needs_evidence"
        className="bg-card rounded-xl p-3 sm:p-3.5 border border-border flex flex-col justify-between hover:bg-muted/40 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Evidence Gaps
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>
        <div>
          <p className="text-xl font-semibold font-mono text-foreground tabular-nums leading-tight">
            {evidenceGapsCount}
          </p>
          <span className="text-[11px] text-muted-foreground truncate block">
            Missing PoD / invoice
          </span>
        </div>
      </Link>
    </div>
  );
}
