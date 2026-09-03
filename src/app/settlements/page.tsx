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
  const [loading, setLoading] = useState(true);
  const [settlements] = useState<SettlementItem[]>(mockSettlements);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    try {
      const blob = new Blob([JSON.stringify(settlements, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `razorpay-settlements-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Settlements summary statement downloaded");
    } catch (err) {
      console.error("Statement download error:", err);
      toast.error("Failed to download settlement statement");
    }
  };

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Settlements View Error">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Settlements Ledger
              </h1>
              <p className="text-xs text-muted-slate mt-1 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <span>Bank payouts, net disbursements, and dispute reserve hold adjustments</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={loading || settlements.length === 0}
                className="flex items-center gap-2 px-4 py-1.5 rounded-[4px] bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-colors h-9 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export Statement</span>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-3">
                  <Skeleton className="h-3 w-28 bg-slate-100" />
                  <Skeleton className="h-7 w-24 bg-slate-100" />
                  <Skeleton className="h-3 w-36 bg-slate-100" />
                </div>
              ))
            ) : (
              <>
                <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-slate">
                    Total Settled (MTD)
                  </div>
                  <div className="font-mono text-2xl font-bold text-ink mt-2 tracking-tight">
                    ₹8,69,500.00
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Disbursed directly to HDFC Bank ··· 8891
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-slate">
                    Dispute Reserve Hold
                  </div>
                  <div className="font-mono text-2xl font-bold text-amber-600 mt-2 tracking-tight">
                    ₹61,698.00
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Held in reserve pending staged contest review
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-slate">
                    Settlement Schedule
                  </div>
                  <div className="font-mono text-2xl font-bold text-primary mt-2 tracking-tight">
                    T+1 Daily Payout
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Automated NEFT / RTGS banking cycle
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settlements Table */}
          <div className="bg-white rounded-[4px] border border-border-subtle shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-slate-50/70">
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      SETTLEMENT ID
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      DATE & TIME
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      BANK ACCOUNT & UTR
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase text-right">
                      GROSS AMOUNT
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase text-right">
                      NET DISBURSED
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase text-right">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-ink bg-white divide-y divide-border-subtle">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-32 bg-slate-100" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-28 bg-slate-100" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-40 bg-slate-100" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto bg-slate-100" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto bg-slate-100" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-5 w-20 ml-auto bg-slate-100" /></td>
                      </tr>
                    ))
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-slate">
                        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                          <div className="p-3 bg-slate-100 rounded-full text-muted-slate">
                            <FileQuestion className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink text-sm">
                              No settlements processed
                            </p>
                            <p className="text-xs text-muted-slate mt-0.5">
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
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-xs text-primary">
                          {st.id}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-slate font-mono">
                          {st.settledAt}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-xs text-ink flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-slate" />
                            <span>{st.bankAccount}</span>
                          </div>
                          <div className="text-[11px] font-mono text-muted-slate mt-0.5">
                            UTR: {st.utr}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-muted-slate text-right">
                          ₹{((st.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-ink text-right">
                          ₹{((st.net || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                            PROCESSED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3.5 border-t border-border-subtle flex justify-between items-center bg-white">
              <span className="text-xs text-muted-slate font-mono">
                Showing {settlements.length} recent settlements
              </span>
              <div className="flex gap-1">
                <button
                  className="p-1 rounded-[4px] text-muted-slate hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  disabled
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="p-1 rounded-[4px] text-muted-slate hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  disabled
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
