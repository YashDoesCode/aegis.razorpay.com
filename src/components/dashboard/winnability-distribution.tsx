"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WinnabilityDistributionProps {
  strongPercent?: number;
  moderatePercent?: number;
  weakPercent?: number;
  unknownPercent?: number;
  confidenceScore?: number;
  className?: string;
}

export function WinnabilityDistribution({
  strongPercent = 64,
  moderatePercent = 21,
  weakPercent = 10,
  unknownPercent = 5,
  confidenceScore = 85,
  className,
}: WinnabilityDistributionProps) {
  const [viewMode, setViewMode] = useState<"volume" | "value">("volume");
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  const bands = [
    {
      id: "strong",
      label: "Strong",
      sublabel: "≥80%",
      percent: strongPercent,
      colorClass: "bg-emerald-600 dark:bg-emerald-500",
      description: "Auto-contest representment ready with verified POD",
    },
    {
      id: "moderate",
      label: "Moderate",
      sublabel: "50-79%",
      percent: moderatePercent,
      colorClass: "bg-slate-700 dark:bg-slate-300",
      description: "Needs secondary proof or customer communication",
    },
    {
      id: "weak",
      label: "Weak",
      sublabel: "<50%",
      percent: weakPercent,
      colorClass: "bg-rose-600 dark:bg-rose-500",
      description: "Missing mandatory delivery or refund policy records",
    },
    {
      id: "unscored",
      label: "Unscored",
      sublabel: "Sync",
      percent: unknownPercent,
      colorClass: "bg-muted-foreground/30",
      description: "Pending initial metadata ingestion",
    },
  ];

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-4 sm:p-5 border border-border flex flex-col justify-between shadow-xs transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Winnability Distribution
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {confidenceScore}% confidence scoring distribution
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setViewMode((prev) => (prev === "volume" ? "value" : "volume"))
          }
          aria-label={`Toggle distribution view mode. Current: ${viewMode}`}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-md shadow-xs transition cursor-pointer"
        >
          <span>{viewMode === "volume" ? "By volume" : "By value"}</span>
          <ChevronDown className="w-3 h-3 stroke-[2]" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 items-end h-36 sm:h-40 px-1 pb-1 pt-1 select-none">
        {bands.map((band) => (
          <div
            key={band.id}
            onPointerEnter={() => setHoveredBand(band.id)}
            onPointerLeave={() => setHoveredBand(null)}
            className="flex flex-col items-center h-full justify-end cursor-pointer"
          >
            <div className="w-full bg-muted/40 rounded-lg p-1 flex flex-col justify-end h-full">
              <div
                className={cn(
                  "w-full rounded-md transition-all duration-300 p-2 text-white flex flex-col justify-between shadow-xs",
                  band.colorClass,
                  hoveredBand === band.id ? "opacity-100 ring-2 ring-foreground/20" : "opacity-90"
                )}
                style={{ height: `${Math.max(22, band.percent)}%` }}
              >
                <span className="text-xs font-semibold font-mono">
                  {band.percent}%
                </span>
                <span className="text-[9px] font-medium opacity-80 uppercase font-mono">
                  {band.sublabel}
                </span>
              </div>
            </div>
            <span className="text-xs font-medium text-foreground mt-1.5">
              {band.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
