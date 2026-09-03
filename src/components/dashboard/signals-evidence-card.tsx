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
        "bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Lightbulb icon */}
          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-xs">
            <Lightbulb className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Signals &amp; Evidence
          </span>
        </div>

        <Link
          href="/settings"
          aria-label="Open Insights"
          className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-500 hover:text-slate-950 transition shadow-xs cursor-pointer"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
        </Link>
      </div>

      <div className="my-2.5">
        <p className="text-slate-600 text-xs leading-relaxed">
          Delivery confirmation matched for{" "}
          <strong className="text-slate-900 font-semibold">
            {matchedDeliveryRate}% of fulfillment disputes
          </strong>
          . Automated courier logs improved representment readiness by{" "}
          <strong className="text-emerald-600 font-semibold font-mono">
            +{readinessBoost}%
          </strong>
          .
        </p>
      </div>

      <div>
        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-2">
          Connected Pipelines
        </span>
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Razorpay Core */}
          <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-semibold text-slate-800 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Razorpay Core
          </div>

          {/* Carrier PoD */}
          <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-semibold text-slate-800 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Carrier PoD
          </div>

          {/* Shield Risk */}
          <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-semibold text-slate-800 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Shield Risk
          </div>

          {/* Card Schemes */}
          <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-semibold text-slate-500 shadow-xs">
            Card Schemes
          </div>
        </div>
      </div>
    </div>
  );
}
