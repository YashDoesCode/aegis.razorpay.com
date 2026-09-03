"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score?: number;
  className?: string;
}

export function HealthScore({ score = 76, className }: HealthScoreProps) {
  // Normalize score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));
  const activeSegments = Math.round((normalizedScore / 100) * 10);

  return (
    <div
      className={cn(
        "flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-full text-xs shadow-xs select-none",
        className
      )}
      title={`Aegis Health Score: ${normalizedScore}/100 based on representment win rate & evidence readiness`}
      role="status"
      aria-label={`Aegis Health Score: ${normalizedScore} out of 100`}
    >
      {/* Segmented Micro Meter (10 Bars) */}
      <div className="flex items-center gap-[2.5px]" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => {
          const isActive = i < activeSegments;
          return (
            <span
              key={i}
              className={cn(
                "w-1 h-3 rounded-full transition-colors duration-300",
                isActive ? "bg-emerald-500" : "bg-slate-200"
              )}
            />
          );
        })}
      </div>

      <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
        {normalizedScore}
        <span className="text-[10px] text-slate-400 font-normal">/100</span>
      </span>

      <span className="text-slate-500 font-medium border-l border-slate-200 pl-2.5 text-[11px] whitespace-nowrap">
        Health Score
      </span>
    </div>
  );
}
