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
        className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
            Open Queue
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 dark:text-white tabular-nums leading-tight">
            {openQueueCount}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Active resolution
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=high_risk"
        className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:bg-white dark:hover:bg-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
            High-Risk
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 dark:text-white tabular-nums leading-tight">
            {highRiskCount}
          </p>
          <span className="inline-block text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-1 py-0.5 rounded border border-rose-100/60 dark:border-rose-800/60">
            SLA &lt; 24h
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=won"
        className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
            Won Ratio
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 dark:text-white tabular-nums leading-tight">
            {wonCount}
          </p>
          <span className="inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1 py-0.5 rounded font-mono border border-emerald-100/60 dark:border-emerald-800/60">
            {winRatePercent}% win rate
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=needs_evidence"
        className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:bg-white dark:hover:bg-slate-800 hover:border-amber-200 dark:hover:border-amber-900/60 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
            Evidence Gaps
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 dark:text-white tabular-nums leading-tight">
            {evidenceGapsCount}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium truncate block">
            Missing PoD / invoice
          </span>
        </div>
      </Link>
    </div>
  );
}
