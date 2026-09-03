"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FraudRiskCardProps {
  score?: number;
  statusText?: string;
  stabilityDelta?: number;
  className?: string;
}

export function FraudRiskCard({
  score = 72,
  statusText = "Velocity spike detected in card testing batches",
  stabilityDelta = 4,
  className,
}: FraudRiskCardProps) {
  return (
    <div
      className={cn(
        "bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Risk Score
        </span>
        <Link
          href="/disputes?filter=high_risk"
          aria-label="Risk Details"
          className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
        </Link>
      </div>

      <div className="my-0.5">
        <div className="flex items-baseline">
          <span className="text-3xl font-extrabold font-mono text-slate-950 dark:text-white tabular-nums">
            {score}
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-normal ml-1 font-mono">
            /100
          </span>
        </div>
        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5 leading-snug">
          {statusText}
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-end overflow-hidden pt-1 select-none">
        <svg
          className="w-40 sm:w-44 h-20 sm:h-22 overflow-visible"
          viewBox="0 0 200 100"
          aria-hidden="true"
        >
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeLinecap="round"
            strokeWidth="14"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 135 28"
            fill="none"
            stroke="#10B981"
            strokeLinecap="round"
            strokeWidth="14"
          />
          <circle
            className="shadow-sm"
            cx="135"
            cy="28"
            fill="#0F172A"
            r="7"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
        </svg>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-1.5 font-medium">
          Stability improved by{" "}
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            +{stabilityDelta}%
          </span>{" "}
          vs last run
        </p>
      </div>
    </div>
  );
}
