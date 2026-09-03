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
        className="bg-slate-50/70 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:border-slate-300 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
            Open Queue
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 tabular-nums leading-tight">
            {openQueueCount}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Active resolution
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=high_risk"
        className="bg-slate-50/70 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:border-rose-200 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
            High-Risk
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 tabular-nums leading-tight">
            {highRiskCount}
          </p>
          <span className="inline-block text-[10px] font-semibold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-100/60">
            SLA &lt; 24h
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=won"
        className="bg-slate-50/70 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:border-emerald-200 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
            Won Ratio
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 tabular-nums leading-tight">
            {wonCount}
          </p>
          <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono border border-emerald-100/60">
            {winRatePercent}% win rate
          </span>
        </div>
      </Link>

      <Link
        href="/disputes?filter=needs_evidence"
        className="bg-slate-50/70 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:border-amber-200 transition-all duration-150 group shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
            Evidence Gaps
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-950 tabular-nums leading-tight">
            {evidenceGapsCount}
          </p>
          <span className="text-[10px] text-amber-700 font-medium truncate block">
            Missing PoD / invoice
          </span>
        </div>
      </Link>
    </div>
  );
}
