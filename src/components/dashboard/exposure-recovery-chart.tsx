"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const activeRange = onRangeChange ? selectedRange : internalRange;
  const ranges: TimeRangeOption[] = ["7D", "30D", "90D", "6M", "1Y", "All"];

  const handleRangeClick = (range: TimeRangeOption) => {
    setIsLocked(false);
    setSelectedIndex(null);
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
      return { x, yExp, yRec, point: p, index: i };
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

  const activeIndex = selectedIndex ?? coordinates.length - 1;
  const activeCoord = coordinates[activeIndex] || coordinates[coordinates.length - 1] || null;
  const activePoint = activeCoord?.point || points[points.length - 1] || null;

  const updateNearestPoint = useCallback((clientX: number) => {
    if (!containerRef.current || coordinates.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const targetSvgX = 20 + relativeX * (1000 - 40);

    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < coordinates.length; i++) {
      const dist = Math.abs(coordinates[i].x - targetSvgX);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    setSelectedIndex(nearestIdx);
  }, [coordinates]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    updateNearestPoint(e.clientX);
  };

  const handleClick = (e: React.PointerEvent<HTMLDivElement>) => {
    updateNearestPoint(e.clientX);
    setIsLocked((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev === null ? coordinates.length - 2 : Math.max(0, prev - 1)));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev === null ? 0 : Math.min(coordinates.length - 1, prev + 1)));
    } else if (e.key === "Escape") {
      setIsLocked(false);
      setSelectedIndex(null);
    }
  };

  const lineVariants: Variants = {
    hidden: { pathLength: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 1 : 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: prefersReducedMotion ? 0 : 0.6, ease: "easeOut" },
        opacity: { duration: 0.15 },
      },
    },
  };

  const fillVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.4,
        delay: prefersReducedMotion ? 0 : 0.2,
        ease: "easeOut",
      },
    },
  };

  return (
    <div
      id="tour-exposure-chart"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "bg-card rounded-xl p-4 sm:p-5 border border-border relative flex flex-col justify-between shadow-xs transition-colors duration-200 outline-hidden focus-visible:ring-1 focus-visible:ring-foreground",
        className
      )}
      aria-label="Interactive Dispute Exposure & Recovery Chart"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Dispute Exposure &amp; Recovery
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium border border-border">
              Gateway Cycle
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-4 mt-1">
            <div>
              <span className="text-xs text-muted-foreground">Exposure</span>
              <span className="text-xl font-semibold font-mono text-foreground tabular-nums ml-1.5">
                {totalExposure}
              </span>
            </div>

            <div className="h-3 w-px bg-border hidden sm:block" />

            <div>
              <span className="text-xs text-muted-foreground">Recovered</span>
              <span className="text-xl font-semibold font-mono text-foreground tabular-nums ml-1.5">
                {recoveredAmount}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 ml-1.5">
                (+18.2%)
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border text-xs font-medium text-muted-foreground shadow-xs shrink-0"
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
                  "px-2.5 py-0.5 rounded-md transition-all duration-150 cursor-pointer text-xs focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden",
                  isActive
                    ? "bg-card text-foreground font-medium shadow-xs border border-border"
                    : "hover:text-foreground"
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

      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handleClick}
        className="relative w-full h-44 sm:h-52 mt-1 select-none cursor-crosshair touch-none"
      >
        <div className="absolute inset-x-0 top-3 border-b border-dashed border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono pointer-events-none">
          <span>₹{(maxVal / 10000000).toFixed(1)}L</span>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-sans font-normal">
            Max Exposure
          </span>
        </div>

        <div className="absolute inset-x-0 top-20 border-b border-dashed border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono pointer-events-none">
          <span>₹{((maxVal * 0.5) / 10000000).toFixed(1)}L</span>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-sans font-normal">
            Target Base
          </span>
        </div>

        <svg
          key={activeRange}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
          aria-label="Historical trend chart"
        >
          <defs>
            <linearGradient id="expGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="recGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
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
            stroke="#64748B"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            initial="hidden"
            animate="visible"
            variants={lineVariants}
          />
          <motion.path
            d={recoveryPath}
            fill="none"
            stroke="currentColor"
            className="text-foreground"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            initial="hidden"
            animate="visible"
            variants={lineVariants}
          />

          {activeCoord && (
            <line
              x1={activeCoord.x}
              y1={10}
              x2={activeCoord.x}
              y2={190}
              stroke="currentColor"
              className="text-muted-foreground opacity-40"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )}

          {coordinates.map((c, i) => {
            const isActive = i === activeIndex;
            return (
              <g key={i}>
                <circle
                  cx={c.x}
                  cy={c.yExp}
                  r={isActive ? "4" : "3"}
                  fill="var(--card)"
                  stroke="#64748B"
                  strokeWidth="1.5"
                />
                <circle
                  cx={c.x}
                  cy={c.yRec}
                  r={isActive ? "4.5" : "3"}
                  fill="var(--card)"
                  stroke="currentColor"
                  className="text-foreground"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {activePoint && (
          <div className="absolute right-3 sm:right-6 top-1 bg-card text-foreground text-xs p-3 rounded-lg shadow-md min-w-[200px] border border-border z-10 pointer-events-none animate-in fade-in duration-100">
            <div className="flex items-center justify-between pb-1.5 border-b border-border text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{activePoint.label}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium text-[11px]">
                {activePoint.winRate}% Win
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 text-xs font-mono">
              <span className="text-muted-foreground flex items-center gap-1.5 font-sans text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Exposure
              </span>
              <span className="font-medium text-foreground">
                ₹{(activePoint.exposurePaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs font-mono">
              <span className="text-muted-foreground flex items-center gap-1.5 font-sans text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Recovered
              </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ₹{(activePoint.recoveredPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            {isLocked && (
              <div className="mt-1.5 pt-1 border-t border-border text-[10px] text-muted-foreground text-center">
                Point locked (click to release)
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border font-mono overflow-x-auto">
        {points.map((p, idx) => (
          <span
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className={cn(
              "px-1 py-0.5 rounded text-[11px] cursor-pointer transition",
              idx === activeIndex ? "text-foreground font-semibold" : "hover:text-foreground"
            )}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
