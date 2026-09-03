"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

type TimeRange = "7D" | "30D" | "90D" | "6M" | "1Y" | "All";

interface ExposureRecoveryChartProps {
  totalExposure?: string;
  recoveredAmount?: string;
  className?: string;
}

export function ExposureRecoveryChart({
  totalExposure = "₹14,28,400",
  recoveredAmount = "₹8,95,200",
  className,
}: ExposureRecoveryChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30D");
  const [activeMonth, setActiveMonth] = useState<string>("May");
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  const ranges: TimeRange[] = ["7D", "30D", "90D", "6M", "1Y", "All"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div
      className={cn(
        "bg-slate-50/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80 relative flex flex-col justify-between shadow-xs",
        className
      )}
    >
      {/* Header: Title & Timeframe Selector Pills */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dispute Exposure &amp; Recovery
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Live Cycle
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-4 mt-1.5">
            <div>
              <span className="text-[11px] text-slate-400">Total Exposure:</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-950 tabular-nums ml-1">
                {totalExposure}
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 ml-1">
                ↓ 8.2%
              </span>
            </div>

            <div className="h-3 w-px bg-slate-200 hidden sm:block" />

            <div>
              <span className="text-[11px] text-slate-400">Recovered:</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 tabular-nums ml-1">
                {recoveredAmount}
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 ml-1">
                (+18.4%)
              </span>
            </div>
          </div>
        </div>

        {/* Time Switcher Pills */}
        <div
          className="flex items-center gap-0.5 bg-white p-1 rounded-full border border-slate-200/80 text-[11px] font-semibold text-slate-500 shadow-xs"
          role="tablist"
          aria-label="Chart time range"
        >
          {ranges.map((range) => {
            const isActive = selectedRange === range;
            return (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-slate-950 text-white font-bold shadow-xs"
                    : "hover:text-slate-950 hover:bg-slate-50"
                )}
                role="tab"
                aria-selected={isActive}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Dual Curve Chart Area */}
      <div
        className="relative w-full h-48 sm:h-56 mt-2 select-none cursor-crosshair"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(true)}
      >
        {/* Threshold reference dashed guides */}
        <div className="absolute inset-x-0 top-3 border-b border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono pointer-events-none">
          <span>₹12.0L</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-medium">
            Upper Risk Bound
          </span>
        </div>

        <div className="absolute inset-x-0 top-24 border-b border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono pointer-events-none">
          <span>₹8.0L</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans font-medium">
            Target Defense Base
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-6 border-b border-slate-200/70 text-[10px] text-slate-400 font-mono pointer-events-none">
          <span>₹4.0L</span>
        </div>

        {/* Highlight Band for May Surge Window */}
        <div className="absolute left-[38%] right-[44%] top-2 bottom-6 bg-blue-50/70 rounded-sm border-x border-dashed border-blue-200 pointer-events-none" />

        {/* Precision Vector Graph */}
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 1000 240"
          aria-label="Dispute Exposure and Recovery historical trend chart"
        >
          <defs>
            <linearGradient id="exposureGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="recoveryGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fills */}
          <path
            d="M 0,160 C 90,155 160,150 250,140 C 320,135 380,110 440,75 L 470,82 L 520,70 L 580,115 L 640,125 L 710,130 C 800,135 900,145 1000,140 L 1000,210 L 0,210 Z"
            fill="url(#exposureGrad)"
          />
          <path
            d="M 0,195 C 100,190 170,185 250,175 C 320,168 380,145 440,110 L 470,115 L 520,95 L 580,135 L 640,145 L 710,140 C 800,135 900,130 1000,125 L 1000,210 L 0,210 Z"
            fill="url(#recoveryGrad)"
          />

          {/* Line Strokes */}
          <path
            d="M 0,160 C 90,155 160,150 250,140 C 320,135 380,110 440,75 L 470,82 L 520,70 L 580,115 L 640,125 L 710,130 C 800,135 900,145 1000,140"
            fill="none"
            stroke="#2563EB"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M 0,195 C 100,190 170,185 250,175 C 320,168 380,145 440,110 L 470,115 L 520,95 L 580,135 L 640,145 L 710,140 C 800,135 900,130 1000,125"
            fill="none"
            stroke="#059669"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />

          {/* Data point markers */}
          <circle
            cx="440"
            cy="75"
            fill="#FFFFFF"
            r="4.5"
            stroke="#2563EB"
            strokeWidth="2.5"
          />
          <circle
            cx="520"
            cy="95"
            fill="#FFFFFF"
            r="4.5"
            stroke="#059669"
            strokeWidth="2.5"
          />
        </svg>

        {/* Dark contrast inspection bubble */}
        {showTooltip && (
          <div className="absolute left-[38%] sm:left-[44%] -top-1 bg-slate-950 text-white text-xs p-3 rounded-xl shadow-xl min-w-[200px] sm:min-w-[210px] pointer-events-none border border-slate-800 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-medium">May 1 - May 31</span>
              <span className="text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded font-mono font-semibold text-[10px]">
                +82.3% Win
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Exposure
              </span>
              <span className="font-bold text-white">₹9,60,000</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Recovered
              </span>
              <span className="font-bold text-emerald-400">₹7,90,400</span>
            </div>
          </div>
        )}
      </div>

      {/* Month Labels */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/80 font-medium overflow-x-auto">
        {months.map((month) => {
          const isSelected = activeMonth === month;
          return (
            <button
              key={month}
              onClick={() => setActiveMonth(month)}
              className={cn(
                "transition-colors px-1.5 py-0.5 rounded-full cursor-pointer",
                isSelected
                  ? "text-slate-950 font-bold bg-white px-2 py-0.5 shadow-xs border border-slate-200"
                  : "hover:text-slate-700"
              )}
            >
              {month}
            </button>
          );
        })}
      </div>
    </div>
  );
}
