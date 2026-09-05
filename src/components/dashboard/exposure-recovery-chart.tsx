"use client";

import React, { useState, useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { TimeRangeOption, TimeSeriesPoint } from "@/lib/dashboard/service";

interface ExposureRecoveryChartProps {
  totalExposure?: string;
  recoveredAmount?: string;
  timeSeries?: TimeSeriesPoint[];
  selectedRange?: TimeRangeOption;
  onRangeChange?: (range: TimeRangeOption) => void;
  className?: string;
}

export function ExposureRecoveryChart({
  totalExposure = "₹0",
  recoveredAmount = "₹0",
  timeSeries = [],
  selectedRange = "30D",
  onRangeChange,
  className,
}: ExposureRecoveryChartProps) {
  const [internalRange, setInternalRange] = useState<TimeRangeOption>(selectedRange);
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const activeRange = onRangeChange ? selectedRange : internalRange;
  const ranges: TimeRangeOption[] = ["7D", "30D", "90D", "6M", "1Y", "All"];

  const handleRangeClick = (range: TimeRangeOption) => {
    if (onRangeChange) {
      onRangeChange(range);
    } else {
      setInternalRange(range);
    }
  };

  const points = useMemo(() => {
    if (timeSeries.length > 0) return timeSeries;
    const now = new Date();
    const count = activeRange === "7D" ? 7 : activeRange === "30D" ? 6 : activeRange === "90D" ? 3 : 6;
    const generated: TimeSeriesPoint[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 5);
      generated.push({
        date: d.toISOString(),
        label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        exposurePaise: 800000 + i * 120000,
        recoveredPaise: 650000 + i * 90000,
        winRate: 75 + i * 2,
      });
    }
    return generated;
  }, [timeSeries, activeRange]);

  const { exposurePath, recoveryPath, exposureArea, recoveryArea, maxVal, coordinates } = useMemo(() => {
    const width = 1000;
    const height = 180;
    const padding = 20;

    const max = Math.max(
      ...points.map((p) => Math.max(p.exposurePaise, p.recoveredPaise)),
      1000000
    );

    const coords = points.map((p, i) => {
      const x = padding + (i / Math.max(1, points.length - 1)) * (width - padding * 2);
      const yExp = height - (p.exposurePaise / max) * (height - 30);
      const yRec = height - (p.recoveredPaise / max) * (height - 30);
      return { x, yExp, yRec, point: p };
    });

    const expPath = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? "M" : "L"} ${c.x.toFixed(1)},${c.yExp.toFixed(1)}`, "");
    const recPath = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? "M" : "L"} ${c.x.toFixed(1)},${c.yRec.toFixed(1)}`, "");

    const expArea = `${expPath} L ${coords[coords.length - 1]?.x.toFixed(1)},${height} L ${coords[0]?.x.toFixed(1)},${height} Z`;
    const recArea = `${recPath} L ${coords[coords.length - 1]?.x.toFixed(1)},${height} L ${coords[0]?.x.toFixed(1)},${height} Z`;

    return {
      exposurePath: expPath,
      recoveryPath: recPath,
      exposureArea: expArea,
      recoveryArea: recArea,
      maxVal: max,
      coordinates: coords,
    };
  }, [points]);

  const activeTooltip = hoveredPoint || points[points.length - 1] || null;

  const lineVariants: Variants = {
    hidden: { pathLength: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 1 : 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: prefersReducedMotion ? 0 : 0.7, ease: "easeInOut" },
        opacity: { duration: 0.2 },
      },
    },
  };

  const fillVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: prefersReducedMotion ? 0 : 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <div
      id="tour-exposure-chart"
      className={cn(
        "bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 relative flex flex-col justify-between shadow-xs transition-colors duration-200",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-1.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Dispute Exposure &amp; Recovery
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-800">
              Live Gateway Cycle
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 mt-1">
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Total Exposure:</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-slate-950 dark:text-white tabular-nums ml-1">
                {totalExposure}
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 ml-1">
                ↓ 8.4%
              </span>
            </div>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Recovered:</span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums ml-1">
                {recoveredAmount}
              </span>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 ml-1">
                (+18.2%)
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 sm:p-1 rounded-full border border-slate-200/80 dark:border-slate-700 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 shadow-xs shrink-0"
          role="tablist"
          aria-label="Chart time range"
        >
          {ranges.map((range) => {
            const isActive = activeRange === range;
            return (
              <button
                key={range}
                onClick={() => handleRangeClick(range)}
                className={cn(
                  "px-2 sm:px-2.5 py-0.5 rounded-full transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100 focus-visible:outline-hidden",
                  isActive
                    ? "bg-slate-950 dark:bg-blue-600 text-white font-bold shadow-xs"
                    : "hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
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

      <div className="relative w-full h-44 sm:h-52 mt-1 select-none">
        <div className="absolute inset-x-0 top-3 border-b border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono pointer-events-none">
          <span>₹{(maxVal / 10000000).toFixed(1)}L</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans font-medium">
            Upper Risk Bound
          </span>
        </div>

        <div className="absolute inset-x-0 top-20 border-b border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono pointer-events-none">
          <span>₹{((maxVal * 0.5) / 10000000).toFixed(1)}L</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans font-medium">
            Target Defense Base
          </span>
        </div>

        <svg
          key={activeRange}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
          aria-label="Dispute Exposure and Recovery historical trend chart"
        >
          <defs>
            <linearGradient id="expGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#305EFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#305EFF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="recGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00A251" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#00A251" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <motion.path
            d={exposureArea}
            fill="url(#expGrad)"
            initial="hidden"
            animate="visible"
            variants={fillVariants}
          />
          <motion.path
            d={recoveryArea}
            fill="url(#recGrad)"
            initial="hidden"
            animate="visible"
            variants={fillVariants}
          />

          <motion.path
            d={exposurePath}
            fill="none"
            stroke="#305EFF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            initial="hidden"
            animate="visible"
            variants={lineVariants}
          />
          <motion.path
            d={recoveryPath}
            fill="none"
            stroke="#00A251"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            initial="hidden"
            animate="visible"
            variants={lineVariants}
          />

          {coordinates.map((c, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(c.point)}>
              <circle
                cx={c.x}
                cy={c.yExp}
                r="4"
                fill="#FFFFFF"
                stroke="#305EFF"
                strokeWidth="2"
              />
              <circle
                cx={c.x}
                cy={c.yRec}
                r="4"
                fill="#FFFFFF"
                stroke="#00A251"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>

        {activeTooltip && (
          <div className="absolute right-3 sm:right-6 top-1 bg-slate-950 dark:bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl min-w-[190px] border border-slate-800 z-10 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-medium">{activeTooltip.label}</span>
              <span className="text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded font-mono font-semibold text-[10px]">
                {activeTooltip.winRate}% Win
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Exposure
              </span>
              <span className="font-bold text-white">
                ₹{(activeTooltip.exposurePaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Recovered
              </span>
              <span className="font-bold text-emerald-400">
                ₹{(activeTooltip.recoveredPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-200/80 dark:border-slate-800 font-medium overflow-x-auto">
        {points.map((p, idx) => (
          <span
            key={idx}
            onMouseEnter={() => setHoveredPoint(p)}
            className="px-1 py-0.5 rounded text-[10px] sm:text-[11px] font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
