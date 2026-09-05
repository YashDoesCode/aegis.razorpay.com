"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Download,
  Building2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";

interface SettlementItem {
  id: string;
  utr: string;
  amount: number;
  fee: number;
  tax: number;
  net: number;
  bankAccount: string;
  status: string;
  settledAt: string;
}

const mockSettlements: SettlementItem[] = [
  {
    id: "setl_live_992144",
    utr: "HDFCN00982144321",
    amount: 14500000,
    fee: 29000,
    tax: 5220,
    net: 14465780,
    bankAccount: "HDFC Bank ··· 8891",
    status: "processed",
    settledAt: "2026-08-25 18:30 IST",
  },
  {
    id: "setl_live_991823",
    utr: "HDFCN00991823412",
    amount: 22800000,
    fee: 45600,
    tax: 8208,
    net: 22746192,
    bankAccount: "HDFC Bank ··· 8891",
    status: "processed",
    settledAt: "2026-08-24 18:30 IST",
  },
  {
    id: "setl_live_990412",
    utr: "HDFCN00990412891",
    amount: 18450000,
    fee: 36900,
    tax: 6642,
    net: 18406458,
    bankAccount: "HDFC Bank ··· 8891",
    status: "processed",
    settledAt: "2026-08-23 18:30 IST",
  },
  {
    id: "setl_live_989100",
    utr: "HDFCN00989100344",
    amount: 31200000,
    fee: 62400,
    tax: 11232,
    net: 31126368,
    bankAccount: "HDFC Bank ··· 8891",
    status: "processed",
    settledAt: "2026-08-22 18:30 IST",
  },
];

export default function SettlementsPage() {
  const { mode } = useMerchantMode();
  const [loading, setLoading] = useState(true);
  const [settlements] = useState<SettlementItem[]>(mockSettlements);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = (format: "csv" | "json" = "csv") => {
    try {
      const exportUrl = `/api/export?type=settlements&format=${format}&mode=${mode}`;
      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", `razorpay-settlements-${mode}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Settlement report (${format.toUpperCase()}) downloaded`);
    } catch {
      toast.error("Failed to download settlement statement");
    }
  };

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Settlements View Error">
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Settlements Ledger
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <span>Bank payouts, net disbursements, and dispute reserve hold adjustments</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload("csv")}
                disabled={loading || settlements.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-medium transition-opacity h-9 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-2.5">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-7 w-24 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
              ))
            ) : (
              <>
                <div className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total Settled (MTD)
                  </div>
                  <div className="font-mono text-xl font-semibold text-foreground tracking-tight">
                    ₹8,69,500.00
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Disbursed to HDFC Bank ··· 8891
                  </div>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Dispute Reserve Hold
                  </div>
                  <div className="font-mono text-xl font-semibold text-amber-600 dark:text-amber-400 tracking-tight">
                    ₹61,698.00
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Held pending staged contest review
                  </div>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Settlement Schedule
                  </div>
                  <div className="font-mono text-xl font-semibold text-foreground tracking-tight">
                    T+1 Daily Payout
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Automated banking cycle
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Settlement ID
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Date &amp; Time
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Bank Account &amp; UTR
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase text-right">
                      Gross Amount
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase text-right">
                      Net Disbursed
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs text-foreground bg-card divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-32 rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-28 rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-40 rounded" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto rounded" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto rounded" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto rounded-full" /></td>
                      </tr>
                    ))
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                          <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                            <FileQuestion className="w-5 h-5 opacity-60" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">
                              No settlements processed
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Settlement records will appear here once payouts are disbursed.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    settlements.map((st) => (
                      <tr
                        key={st.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-medium text-xs text-foreground">
                          {st.id}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">
                          {st.settledAt}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{st.bankAccount}</span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            UTR: {st.utr}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs font-mono text-muted-foreground text-right">
                          ₹{((st.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-xs text-foreground text-right">
                          ₹{((st.net || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                            Processed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-border flex justify-between items-center bg-card">
              <span className="text-xs text-muted-foreground font-mono">
                Showing {settlements.length} recent settlements
              </span>
              <div className="flex gap-1">
                <button
                  className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-40 cursor-pointer"
                  disabled
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-40 cursor-pointer"
                  disabled
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
