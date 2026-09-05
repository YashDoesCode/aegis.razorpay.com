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
        "bg-card rounded-xl p-4 sm:p-5 border border-border flex flex-col justify-between shadow-xs transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Risk Score
        </span>
        <Link
          href="/disputes?filter=high_risk"
          aria-label="Risk Details"
          className="w-6 h-6 rounded-md bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
        </Link>
      </div>

      <div className="my-0.5">
        <div className="flex items-baseline">
          <span className="text-2xl font-semibold font-mono text-foreground tabular-nums">
            {score}
          </span>
          <span className="text-muted-foreground text-xs font-normal ml-1 font-mono">
            /100
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground font-normal mt-0.5 leading-snug">
          {statusText}
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-end overflow-hidden pt-1 select-none">
        <svg
          className="w-36 h-18 overflow-visible"
          viewBox="0 0 200 100"
          aria-hidden="true"
        >
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            className="text-muted"
            strokeLinecap="round"
            strokeWidth="10"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 135 28"
            fill="none"
            stroke="currentColor"
            className="text-emerald-600 dark:text-emerald-500"
            strokeLinecap="round"
            strokeWidth="10"
          />
          <circle
            cx="135"
            cy="28"
            fill="var(--card)"
            r="5"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="2"
          />
        </svg>

        <p className="text-[11px] text-muted-foreground text-center mt-1 font-normal">
          Stability delta{" "}
          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
            +{stabilityDelta}%
          </span>
        </p>
      </div>
    </div>
  );
}
