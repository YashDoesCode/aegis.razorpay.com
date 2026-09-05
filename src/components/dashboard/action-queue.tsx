"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  Clock,
  FileSearch,
  ShieldAlert,
  PackageCheck,
  ChevronRight,
  ListTodo,
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
        "bg-card rounded-xl p-2.5 sm:p-3 border border-border flex items-center justify-between gap-3 shadow-xs transition-colors duration-200",
        className
      )}
      aria-label="Action Queue"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground px-1 shrink-0">
        <ListTodo className="w-3.5 h-3.5 stroke-[2] text-muted-foreground" />
        <span className="uppercase tracking-wider text-[11px] whitespace-nowrap">
          Action Queue
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto py-0.5 custom-scrollbar flex-1"
      >
        <Link
          href="/disputes?filter=due_today"
          className="flex items-center gap-2.5 bg-muted/30 hover:bg-muted/60 px-3 py-1.5 rounded-lg border border-border/70 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
        >
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Clock className="w-3 h-3 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">
              {dueTodayCount} due today
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
              SLA &lt; 24h
            </div>
          </div>
        </Link>

        <Link
          href="/disputes?filter=evidence_gaps"
          className="flex items-center gap-2.5 bg-muted/30 hover:bg-muted/60 px-3 py-1.5 rounded-lg border border-border/70 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
        >
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <FileSearch className="w-3 h-3 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">
              {evidenceGapsCount} evidence gaps
            </div>
            <div className="text-[10px] text-muted-foreground">
              POD pending match
            </div>
          </div>
        </Link>

        <Link
          href="/disputes?filter=high_risk"
          className="flex items-center gap-2.5 bg-muted/30 hover:bg-muted/60 px-3 py-1.5 rounded-lg border border-border/70 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
        >
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <ShieldAlert className="w-3 h-3 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">
              {highRiskCount} high-risk claims
            </div>
            <div className="text-[10px] text-muted-foreground">
              &gt; ₹50,000 exposure
            </div>
          </div>
        </Link>

        <Link
          href="/disputes?filter=courier_sync"
          className="flex items-center gap-2.5 bg-muted/30 hover:bg-muted/60 px-3 py-1.5 rounded-lg border border-border/70 shrink-0 cursor-pointer transition shadow-xs group focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
        >
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <PackageCheck className="w-3 h-3 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">
              {courierEventsCount} courier sync events
            </div>
            <div className="text-[10px] text-muted-foreground">
              Auto-linked tracking
            </div>
          </div>
        </Link>
      </div>

      <button
        type="button"
        onClick={handleScrollRight}
        aria-label="Next Queue Items"
        className="w-6 h-6 rounded-md bg-card hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 ml-auto transition shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
      >
        <ChevronRight className="w-3 h-3 stroke-[2]" />
      </button>
    </section>
  );
}
