"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  FileSearch,
  ShieldAlert,
  PackageCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionQueueProps {
  dueTodayCount?: number;
  evidenceGapsCount?: number;
  highRiskCount?: number;
  courierEventsCount?: number;
  className?: string;
}

export function ActionQueue({
  dueTodayCount = 12,
  evidenceGapsCount = 8,
  highRiskCount = 4,
  courierEventsCount = 3,
  className,
}: ActionQueueProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  return (
    <section
      className={cn(
        "bg-slate-50/70 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs",
        className
      )}
      aria-label="Action Queue"
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-950 px-2 shrink-0">
        <Zap className="w-4 h-4 text-slate-700 stroke-[2.2]" />
        <span className="uppercase tracking-wider text-[11px] whitespace-nowrap">
          Action Queue
        </span>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3 overflow-x-auto py-0.5 custom-scrollbar flex-1"
      >
        {/* Alert Chip 1: Due today */}
        <Link
          href="/disputes?filter=due_today"
          className="flex items-center gap-2.5 bg-white hover:bg-slate-50/80 px-3 py-1.5 rounded-xl border border-rose-200 shrink-0 cursor-pointer transition shadow-xs group"
        >
          <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 transition-colors">
            <Clock className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
              {dueTodayCount} disputes due today
            </div>
            <div className="text-[10px] font-semibold text-rose-600">
              Action required • SLA &lt; 6h
            </div>
          </div>
        </Link>

        {/* Alert Chip 2: Evidence gaps */}
        <Link
          href="/disputes?filter=evidence_gaps"
          className="flex items-center gap-2.5 bg-white hover:bg-slate-50/80 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0 cursor-pointer transition shadow-xs group"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
            <FileSearch className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              {evidenceGapsCount} evidence gaps
            </div>
            <div className="text-[10px] font-medium text-amber-700">
              Carrier PoD pending match
            </div>
          </div>
        </Link>

        {/* Alert Chip 3: High-risk claims */}
        <Link
          href="/disputes?filter=high_risk"
          className="flex items-center gap-2.5 bg-white hover:bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/90 shrink-0 cursor-pointer transition shadow-xs group"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors">
            <ShieldAlert className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
              {highRiskCount} high-risk claims
            </div>
            <div className="text-[10px] font-medium text-slate-500">
              &gt; ₹50,000 claim exposure
            </div>
          </div>
        </Link>

        {/* Alert Chip 4: Courier events */}
        <Link
          href="/disputes?filter=courier_sync"
          className="flex items-center gap-2.5 bg-white hover:bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/90 shrink-0 cursor-pointer transition shadow-xs group"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
            <PackageCheck className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {courierEventsCount} courier events sync
            </div>
            <div className="text-[10px] font-medium text-emerald-700">
              Auto-linking tracking logs
            </div>
          </div>
        </Link>
      </div>

      {/* Scroll Action Chevron */}
      <button
        type="button"
        onClick={handleScrollRight}
        aria-label="Next Queue Items"
        className="w-7 h-7 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-500 hover:text-slate-950 shrink-0 ml-auto transition shadow-xs cursor-pointer"
      >
        <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
      </button>
    </section>
  );
}
