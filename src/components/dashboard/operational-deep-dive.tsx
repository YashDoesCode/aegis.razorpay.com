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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLogItem {
  id: string;
  timestamp: string;
  disputeId: string;
  action: string;
  category: "automation" | "evidence" | "sync" | "security";
  status: "success" | "pending" | "warning";
}

const liveActivityFeed: ActivityLogItem[] = [
  {
    id: "act_1",
    timestamp: "2 mins ago",
    disputeId: "disp_1064_goods",
    action: "Autonomous AI rebuttal generated with 92% win probability score",
    category: "automation",
    status: "success",
  },
  {
    id: "act_2",
    timestamp: "14 mins ago",
    disputeId: "disp_4837_fraud",
    action: "Delhivery AWB #DLV92837120 proof of delivery & GPS signature verified",
    category: "evidence",
    status: "success",
  },
  {
    id: "act_3",
    timestamp: "32 mins ago",
    disputeId: "disp_1084_damaged",
    action: "Customer WhatsApp communication history extracted & packaged",
    category: "evidence",
    status: "success",
  },
  {
    id: "act_4",
    timestamp: "1 hr ago",
    disputeId: "disp_1061_dup",
    action: "Razorpay API dispute rebuttal submitted automatically to card network",
    category: "sync",
    status: "success",
  },
  {
    id: "act_5",
    timestamp: "2 hrs ago",
    disputeId: "disp_1064_delhivery",
    action: "SLA alert: 18 hours remaining to submit rebuttal documentation",
    category: "security",
    status: "warning",
  },
];

const reasonCodeStats = [
  {
    code: "1064",
    name: "Goods / Service Not Received",
    disputeCount: 14,
    amount: "₹18,40,000",
    winRate: 91,
    evidenceCoverage: "100%",
  },
  {
    code: "4837",
    name: "No Cardholder Authorization",
    disputeCount: 8,
    amount: "₹12,85,000",
    winRate: 84,
    evidenceCoverage: "94%",
  },
  {
    code: "1084",
    name: "Merchandise Defective / Damaged",
    disputeCount: 5,
    amount: "₹6,50,000",
    winRate: 72,
    evidenceCoverage: "88%",
  },
  {
    code: "1061",
    name: "Duplicate Charge Alleged",
    disputeCount: 3,
    amount: "₹2,10,000",
    winRate: 98,
    evidenceCoverage: "100%",
  },
];

const courierPerformance = [
  { name: "Delhivery Surface & Express", verifiedPODs: 142, matchRate: "96.4%", avgSyncSec: 1.2 },
  { name: "BlueDart Express Courier", verifiedPODs: 98, matchRate: "94.8%", avgSyncSec: 1.8 },
  { name: "Shadowfax Hyperlocal", verifiedPODs: 46, matchRate: "91.2%", avgSyncSec: 2.1 },
];

export function OperationalDeepDive() {
  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dispute Reason Code Analytics &amp; Recovery Matrix
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Performance breakdown by Visa, Mastercard &amp; UPI chargeback reason categories
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto my-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-2 px-1">Reason Code</th>
                  <th className="py-2 px-2">Disputes</th>
                  <th className="py-2 px-2">Total Exposure</th>
                  <th className="py-2 px-2">Win Probability</th>
                  <th className="py-2 px-2">Evidence Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {reasonCodeStats.map((stat) => (
                  <tr key={stat.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-1">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          Code {stat.code}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {stat.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-700 dark:text-slate-300">
                      {stat.disputeCount}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-slate-900 dark:text-white">
                      {stat.amount}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              stat.winRate >= 90
                                ? "bg-emerald-500"
                                : stat.winRate >= 80
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            )}
                            style={{ width: `${stat.winRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          {stat.winRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {stat.evidenceCoverage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Avg Rebuttal Generation Time: <strong className="text-slate-800 dark:text-slate-200 font-mono">1.4 seconds</strong>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Razorpay Webhook Latency: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">&lt;200ms</strong>
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-time Defense Activity Audit Log
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scrollable audit trail of autonomous actions &amp; evidence fetches
                </p>
              </div>
            </div>
          </div>

          <div className="my-3 space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
            {liveActivityFeed.map((act) => (
              <div
                key={act.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5 text-xs transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                {act.category === "automation" && (
                  <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                )}
                {act.category === "evidence" && (
                  <FileCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {act.category === "sync" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {act.category === "security" && (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}

                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate font-mono">
                      {act.disputeId}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    {act.action}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Immutable SHA-256 Audit Engine Active</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3PL Courier Evidence Pipeline &amp; POD Verification
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Automated proof of delivery, GPS coordinates, and recipient signature matching
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Syncing every 5 minutes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-3.5">
          {courierPerformance.map((courier) => (
            <div
              key={courier.name}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {courier.name}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Verified PODs</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{courier.verifiedPODs}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Match Rate</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{courier.matchRate}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Latency</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{courier.avgSyncSec}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
