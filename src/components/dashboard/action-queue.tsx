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
      id="tour-action-queue"
      className={cn(
        "bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-2 sm:p-2.5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 shadow-xs transition-colors duration-200",
        className
      )}
      aria-label="Action Queue"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-950 dark:text-white px-1.5 sm:px-2 shrink-0">
        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300 stroke-[2.2]" />
        <span className="uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap">
          Action Queue
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto py-0.5 custom-scrollbar flex-1"
      >
        <Link
          href="/disputes?filter=due_today"
          className="flex items-center gap-2 sm:gap-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-750 px-2.5 sm:px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-hidden"
        >
          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-lg bg-rose-50 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900 transition-colors shrink-0">
            <Clock className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
              {dueTodayCount} disputes due today
            </div>
            <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              Action required • SLA &lt; 6h
            </div>
          </div>
        </Link>

        <Link
          href="/disputes?filter=evidence_gaps"
          className="flex items-center gap-2 sm:gap-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-750 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden"
        >
          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-lg bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors shrink-0">
            <FileSearch className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              {evidenceGapsCount} evidence gaps
            </div>
            <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
              Carrier PoD pending match
            </div>
          </div>
        </Link>

        <Link
          href="/disputes?filter=high_risk"
          className="flex items-center gap-2 sm:gap-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-750 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
        >
          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
              {highRiskCount} high-risk claims
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              &gt; ₹50,000 claim exposure
            </div>
          </div>
        </Link>

        <Link
          href="/disputes?filter=courier_sync"
          className="flex items-center gap-2 sm:gap-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-750 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden"
        >
          <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors shrink-0">
            <PackageCheck className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {courierEventsCount} courier events sync
            </div>
            <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
              Auto-linking tracking logs
            </div>
          </div>
        </Link>
      </div>

      <button
        type="button"
        onClick={handleScrollRight}
        aria-label="Next Queue Items"
        className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white shrink-0 ml-auto transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
      >
        <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
      </button>
    </section>
  );
}
