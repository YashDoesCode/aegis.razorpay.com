"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score?: number;
  className?: string;
}

export function HealthScore({ score = 76, className }: HealthScoreProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const activeSegments = Math.round((normalizedScore / 100) * 10);

  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-card border border-border px-2.5 py-1 rounded-lg text-xs shadow-xs select-none transition-colors duration-200",
        className
      )}
      title={`Aegis Health Score: ${normalizedScore}/100`}
      role="status"
      aria-label={`Aegis Health Score: ${normalizedScore} out of 100`}
    >
      <div className="flex items-center gap-[2px]" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => {
          const isActive = i < activeSegments;
          return (
            <span
              key={i}
              className={cn(
                "w-1 h-2.5 rounded-sm transition-colors duration-200",
                isActive ? "bg-emerald-600 dark:bg-emerald-500" : "bg-muted"
              )}
            />
          );
        })}
      </div>

      <span className="font-mono font-medium text-foreground text-xs tabular-nums">
        {normalizedScore}
        <span className="text-[10px] text-muted-foreground font-normal">/100</span>
      </span>

      <span className="text-muted-foreground font-normal border-l border-border pl-2 text-[11px] whitespace-nowrap">
        Health
      </span>
    </div>
  );
}
