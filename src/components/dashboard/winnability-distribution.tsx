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

  return (
    <div
      className={cn(
        "bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Winnability Distribution
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {confidenceScore}% deterministic ML confidence score
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setViewMode((prev) => (prev === "volume" ? "value" : "volume"))
            }
            aria-label={`Toggle distribution view mode. Current: ${viewMode}`}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200/90 px-2.5 py-1 rounded-full shadow-xs hover:text-slate-950 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
          >
            <span>{viewMode === "volume" ? "By volume" : "By value"}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* 4 Column Bars with diagonal hatching for Unknown state */}
      <div className="grid grid-cols-4 gap-3 items-end h-40 px-1 pb-1 pt-2 select-none">
        {/* Strong: 64% */}
        <div className="flex flex-col items-center h-full justify-end group">
          <div className="w-full bg-slate-200/60 rounded-xl p-1 flex flex-col justify-end h-full">
            <div
              className="w-full bg-emerald-600 rounded-lg transition-all duration-500 p-2 text-white flex flex-col justify-between shadow-xs"
              style={{ height: `${Math.max(20, strongPercent)}%` }}
            >
              <span className="text-xs font-bold font-mono">
                {strongPercent}%
              </span>
              <span className="text-[9px] font-medium opacity-80 uppercase">
                High
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 mt-2">
            Strong
          </span>
        </div>

        {/* Moderate: 21% */}
        <div className="flex flex-col items-center h-full justify-end group">
          <div className="w-full bg-slate-200/60 rounded-xl p-1 flex flex-col justify-end h-full">
            <div
              className="w-full bg-blue-600 rounded-lg transition-all duration-500 p-2 text-white flex flex-col justify-between shadow-xs"
              style={{ height: `${Math.max(20, moderatePercent * 1.8)}%` }}
            >
              <span className="text-xs font-bold font-mono">
                {moderatePercent}%
              </span>
              <span className="text-[9px] font-medium opacity-80 uppercase">
                Mid
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 mt-2">
            Moderate
          </span>
        </div>

        {/* Weak: 10% */}
        <div className="flex flex-col items-center h-full justify-end group">
          <div className="w-full bg-slate-200/60 rounded-xl p-1 flex flex-col justify-end h-full">
            <div
              className="w-full bg-rose-500 rounded-lg transition-all duration-500 p-2 text-white flex flex-col justify-between shadow-xs"
              style={{ height: `${Math.max(18, weakPercent * 2)}%` }}
            >
              <span className="text-xs font-bold font-mono">{weakPercent}%</span>
              <span className="text-[9px] font-medium opacity-80 uppercase">
                Low
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 mt-2">
            Weak
          </span>
        </div>

        {/* Unknown: 5% (with subtle diagonal hatching) */}
        <div className="flex flex-col items-center h-full justify-end group">
          <div className="w-full bg-slate-200/60 rounded-xl p-1 flex flex-col justify-end h-full pattern-subtle-hatch">
            <div
              className="w-full bg-slate-400 rounded-lg transition-all duration-500 p-1.5 text-white flex flex-col justify-between shadow-xs"
              style={{ height: `${Math.max(15, unknownPercent * 3)}%` }}
            >
              <span className="text-[11px] font-bold font-mono">
                {unknownPercent}%
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-700 mt-2">
            Unknown
          </span>
        </div>
      </div>
    </div>
  );
}
