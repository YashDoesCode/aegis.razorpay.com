"use client";

import React from "react";
import Link from "next/link";
import { Lightbulb, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalsEvidenceCardProps {
  matchedDeliveryRate?: number;
  readinessBoost?: number;
  className?: string;
}

export function SignalsEvidenceCard({
  matchedDeliveryRate = 84,
  readinessBoost = 18,
  className,
}: SignalsEvidenceCardProps) {
  return (
    <div
      className={cn(
        "bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-750 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-xs">
            <Lightbulb className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Signals &amp; Evidence
          </span>
        </div>

        <Link
          href="/settings"
          aria-label="Open Insights"
          className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
        </Link>
      </div>

      <div className="my-2">
        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
          Delivery confirmation matched for{" "}
          <strong className="text-slate-900 dark:text-white font-semibold">
            {matchedDeliveryRate}% of fulfillment disputes
          </strong>
          . Automated courier logs improved representment readiness by{" "}
          <strong className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
            +{readinessBoost}%
          </strong>
          .
        </p>
      </div>

      <div>
        <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1.5">
          Connected Pipelines
        </span>
        <div className="flex items-center flex-wrap gap-1.5">
          <div className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Razorpay Core
          </div>

          <div className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Carrier PoD
          </div>

          <div className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Shield Risk
          </div>

          <div className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shadow-xs">
            Card Schemes
          </div>
        </div>
      </div>
    </div>
  );
}
