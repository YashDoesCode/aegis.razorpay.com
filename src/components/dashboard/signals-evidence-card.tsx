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
        "bg-card rounded-xl p-4 sm:p-5 border border-border flex flex-col justify-between shadow-xs transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
            <Lightbulb className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Signals &amp; Evidence
          </span>
        </div>

        <Link
          href="/settings"
          aria-label="Open Insights"
          className="w-6 h-6 rounded-md bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
        </Link>
      </div>

      <div className="my-2">
        <p className="text-foreground text-xs leading-relaxed">
          Delivery confirmation matched for{" "}
          <strong className="font-medium text-foreground">
            {matchedDeliveryRate}% of fulfillment disputes
          </strong>
          . Automated courier logs improved representment readiness by{" "}
          <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">
            +{readinessBoost}%
          </span>
          .
        </p>
      </div>

      <div>
        <span className="text-[10px] font-medium uppercase text-muted-foreground tracking-wide block mb-1.5">
          Connected Pipelines
        </span>
        <div className="flex items-center flex-wrap gap-1.5">
          <div className="px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px] font-medium text-foreground shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Razorpay Core
          </div>

          <div className="px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px] font-medium text-foreground shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Carrier PoD
          </div>

          <div className="px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px] font-medium text-foreground shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Shield Risk
          </div>

          <div className="px-2 py-0.5 rounded-md bg-muted/60 border border-border text-[11px] font-medium text-muted-foreground shadow-xs">
            Card Schemes
          </div>
        </div>
      </div>
    </div>
  );
}
