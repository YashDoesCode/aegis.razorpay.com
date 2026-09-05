"use client";

import React from "react";
import {
  Clock,
  ShieldCheck,
  FileQuestion,
} from "lucide-react";
import {
  ReasonCodeStatItem,
  CourierPerformanceItem,
  DashboardActivityItem,
} from "@/lib/dashboard/service";

interface OperationalDeepDiveProps {
  reasonCodeStats?: ReasonCodeStatItem[];
  recentAuditFeed?: DashboardActivityItem[];
  courierPerformance?: CourierPerformanceItem[];
}

export function OperationalDeepDive({
  reasonCodeStats = [],
  recentAuditFeed = [],
  courierPerformance = [],
}: OperationalDeepDiveProps) {
  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <div className="lg:col-span-7 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <h3 className="text-xs font-semibold text-foreground tracking-tight">
                Reason Code Analytics
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Visa, Mastercard and UPI chargeback performance
              </p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {reasonCodeStats.length} active codes
            </span>
          </div>

          <div className="overflow-x-auto my-3">
            {reasonCodeStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active dispute reason code records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    <th className="py-2 px-1">Reason Code</th>
                    <th className="py-2 px-2 text-right">Disputes</th>
                    <th className="py-2 px-2 text-right">Exposure</th>
                    <th className="py-2 px-2 text-right">Win Rate</th>
                    <th className="py-2 px-2 text-right">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-normal">
                  {reasonCodeStats.map((stat) => (
                    <tr key={stat.code} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-1">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground font-mono text-xs">
                            Code {stat.code}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {stat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                        {stat.disputeCount}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium text-foreground">
                        {stat.amountFormatted}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium text-foreground">
                        {stat.winRate}%
                      </td>
                      <td className="py-2.5 px-2 text-right text-[11px] font-mono text-muted-foreground">
                        {stat.evidenceCoverage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-[11px]">
              Avg Generation: <strong className="text-foreground font-mono font-medium">1.4s</strong>
            </span>
            <span className="text-[11px]">
              Webhook Latency: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">&lt;200ms</strong>
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <h3 className="text-xs font-semibold text-foreground tracking-tight">
                Defense Activity Log
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Audit trail of autonomous evidence orchestration
              </p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              Immutable SHA-256
            </span>
          </div>

          <div className="my-3 space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {recentAuditFeed.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
                <FileQuestion className="w-5 h-5 text-muted-foreground" />
                <span>No audit events logged yet.</span>
              </div>
            ) : (
              recentAuditFeed.map((act) => (
                <div
                  key={act.id}
                  className="py-2 px-2.5 rounded-lg bg-muted/20 border border-border/60 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[11px] text-foreground font-mono truncate">
                        {act.disputeId}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {act.action}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Audit verification engine active</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div>
            <h3 className="text-xs font-semibold text-foreground tracking-tight">
              3PL Courier Pipeline &amp; POD Verification
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Proof of delivery, GPS coordinates, and recipient signature verification
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Sync: 5m</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-3.5">
          {courierPerformance.map((courier) => (
            <div
              key={courier.name}
              className="p-3 rounded-lg bg-muted/20 border border-border/70 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-foreground">
                  {courier.name}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
                <div className="bg-card p-1.5 rounded border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-sans">Verified</span>
                  <span className="text-xs font-medium text-foreground">{courier.verifiedPODs}</span>
                </div>
                <div className="bg-card p-1.5 rounded border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-sans">Match</span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{courier.matchRate}</span>
                </div>
                <div className="bg-card p-1.5 rounded border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-sans">Latency</span>
                  <span className="text-xs font-medium text-foreground">{courier.avgSyncSec}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
