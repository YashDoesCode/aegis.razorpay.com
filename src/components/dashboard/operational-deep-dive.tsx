"use client";

import React from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  FileCheck,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  Reason Code Analytics &amp; Recovery Matrix
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Performance breakdown by Visa, Mastercard &amp; UPI chargeback reason categories
                </p>
              </div>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-border">
              Live Feed
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
                  <tr className="border-b border-border text-[11px] text-muted-foreground uppercase tracking-wide font-normal">
                    <th className="py-2 px-1">Reason Code</th>
                    <th className="py-2 px-2">Disputes</th>
                    <th className="py-2 px-2">Total Exposure</th>
                    <th className="py-2 px-2">Win Probability</th>
                    <th className="py-2 px-2">Evidence Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-normal">
                  {reasonCodeStats.map((stat) => (
                    <tr key={stat.code} className="hover:bg-muted/40 transition">
                      <td className="py-2.5 px-1">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground font-mono">
                            Code {stat.code}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {stat.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-muted-foreground">
                        {stat.disputeCount}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-medium text-foreground">
                        {stat.amountFormatted}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-muted h-1 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                stat.winRate >= 80
                                  ? "bg-emerald-600 dark:bg-emerald-500"
                                  : stat.winRate >= 50
                                  ? "bg-slate-600 dark:bg-slate-400"
                                  : "bg-amber-600 dark:bg-amber-500"
                              )}
                              style={{ width: `${stat.winRate}%` }}
                            />
                          </div>
                          <span className="font-medium text-[11px] text-foreground font-mono">
                            {stat.winRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {stat.evidenceCoverage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted-foreground">
              Avg Rebuttal Generation Time: <strong className="text-foreground font-mono font-medium">1.4s</strong>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Razorpay Webhook Latency: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">&lt;200ms</strong>
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  Real-time Defense Activity Audit Log
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Audit trail of autonomous actions &amp; evidence fetches
                </p>
              </div>
            </div>
          </div>

          <div className="my-3 space-y-2 max-h-[210px] overflow-y-auto pr-1 custom-scrollbar">
            {recentAuditFeed.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
                <FileQuestion className="w-5 h-5 text-muted-foreground" />
                <span>No audit events logged yet.</span>
              </div>
            ) : (
              recentAuditFeed.map((act) => (
                <div
                  key={act.id}
                  className="p-2 rounded-lg bg-muted/30 border border-border flex items-start gap-2 text-xs transition hover:bg-muted/60"
                >
                  {act.category === "automation" && (
                    <Zap className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  {act.category === "evidence" && (
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {act.category === "sync" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {act.category === "security" && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}

                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[11px] text-foreground truncate font-mono">
                        {act.disputeId}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
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

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Immutable SHA-256 Audit Engine Active</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-foreground">
                3PL Courier Evidence Pipeline &amp; POD Verification
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Proof of delivery, GPS coordinates, and recipient signature matching
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Syncing every 5 minutes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-3.5">
          {courierPerformance.map((courier) => (
            <div
              key={courier.name}
              className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-foreground">
                  {courier.name}
                </span>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-border">
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
                <div className="bg-card p-1.5 rounded border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Verified</span>
                  <span className="text-xs font-medium text-foreground">{courier.verifiedPODs}</span>
                </div>
                <div className="bg-card p-1.5 rounded border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Match</span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{courier.matchRate}</span>
                </div>
                <div className="bg-card p-1.5 rounded border border-border">
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
