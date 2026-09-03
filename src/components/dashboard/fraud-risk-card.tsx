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
        "bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Risk Score
        </span>
        <Link
          href="/disputes?filter=high_risk"
          aria-label="Risk Details"
          className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-500 hover:text-slate-950 transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
        </Link>
      </div>

      <div className="my-1">
        <div className="flex items-baseline">
          <span className="text-3xl font-extrabold font-mono text-slate-950 tabular-nums">
            {score}
          </span>
          <span className="text-slate-400 text-xs font-normal ml-1 font-mono">
            /100
          </span>
        </div>
        <p className="text-[11px] text-amber-700 font-medium mt-0.5 leading-snug">
          {statusText}
        </p>
      </div>

      {/* High precision FinPoint style arc meter */}
      <div className="relative flex flex-col items-center justify-end overflow-hidden pt-2 select-none">
        <svg
          className="w-44 h-22 overflow-visible"
          viewBox="0 0 200 100"
          aria-hidden="true"
        >
          {/* Background Arc Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E2E8F0"
            strokeLinecap="round"
            strokeWidth="14"
          />
          {/* Colored Active Indicator Arc Segment */}
          <path
            d="M 20 100 A 80 80 0 0 1 135 28"
            fill="none"
            stroke="#10B981"
            strokeLinecap="round"
            strokeWidth="14"
          />
          {/* Needle Knob Bead */}
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

        <p className="text-[11px] text-slate-500 text-center mt-2 font-medium">
          Stability improved by{" "}
          <span className="text-emerald-600 font-semibold font-mono">
            +{stabilityDelta}%
          </span>{" "}
          vs last run
        </p>
      </div>
    </div>
  );
}
