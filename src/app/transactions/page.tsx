"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Receipt,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { UploadStatementModal } from "@/components/dashboard/upload-statement-modal";
import { DisputeWithRelations } from "@/lib/types/domain";

interface TransactionItem {
  id: string;
  paymentId: string;
  customerName: string;
  customerEmail: string;
  item: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  disputeId?: string | null;
}

export default function TransactionsPage() {
  const { mode } = useMerchantMode();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/disputes?mode=${mode}`);
      const json = await res.json();
      if (json.ok && json.data && Array.isArray(json.data) && json.data.length > 0) {
        const mapped: TransactionItem[] = json.data.map((d: DisputeWithRelations) => ({
          id: `txn_${d.paymentId.replace(/^pay_/, "")}`,
          paymentId: d.paymentId,
          customerName: d.order?.customer?.name || "Customer",
          customerEmail: d.order?.customer?.email || "customer@example.in",
          item: d.order?.item || `Transaction ${d.paymentId}`,
          amount: d.order?.amount || d.amount || 0,
          currency: "INR",
          status: d.status === "open" || d.status === "under_review" ? "disputed" : "captured",
          date: new Date(d.createdAt).toISOString().slice(0, 10),
          disputeId: d.id,
        }));

        setTransactions(mapped);
      } else if (mode === "live" && json.data?.length === 0) {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to load live transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/disputes?mode=${mode}`);
        const json = await res.json();
        if (!ignore && json.ok && json.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: TransactionItem[] = json.data.map((d: DisputeWithRelations) => ({
            id: `txn_${d.paymentId.replace(/^pay_/, "")}`,
            paymentId: d.paymentId,
            customerName: d.order?.customer?.name || "Customer",
            customerEmail: d.order?.customer?.email || "customer@example.in",
            item: d.order?.item || `Transaction ${d.paymentId}`,
            amount: d.order?.amount || d.amount || 0,
            currency: "INR",
            status: d.status === "open" || d.status === "under_review" ? "disputed" : "captured",
            date: new Date(d.createdAt).toISOString().slice(0, 10),
            disputeId: d.id,
          }));

          setTransactions(mapped);
        } else if (!ignore && mode === "live" && json.data?.length === 0) {
          setTransactions([]);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load live transactions:", err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [mode]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.id.toLowerCase().includes(q) ||
        tx.paymentId.toLowerCase().includes(q) ||
        tx.customerName.toLowerCase().includes(q) ||
        tx.item.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" || tx.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, filterStatus]);

  const handleExport = (format: "csv" | "json" = "csv") => {
    try {
      const exportUrl = `/api/export?type=transactions&format=${format}&mode=${mode}`;
      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", `razorpay-transactions-${mode}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${filtered.length} transactions (${format.toUpperCase()})`);
    } catch {
      toast.error("Failed to export transactions");
    }
  };

  return (
    <DashboardShell searchQuery={search} onSearchChange={setSearch}>
      <LocalErrorBoundary fallbackTitle="Transactions View Error">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
                Transactions Ledger
              </h1>
              <p className="text-xs text-muted-slate mt-1 flex items-center gap-1.5 flex-wrap">
                <Receipt className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Payment records and dispute defense linkages across Razorpay gateway</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-all h-9.5 shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Import Statement</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport("csv")}
                disabled={loading || filtered.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-all h-9.5 shadow-xs cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                <span>Export Statement</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["all", "captured", "disputed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                  filterStatus === st
                    ? "bg-[#0D1A48] dark:bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 border border-border-subtle dark:border-slate-700 text-muted-slate hover:text-ink hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border-subtle dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      PAYMENT ID
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      DATE
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      CUSTOMER &amp; ITEM
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase text-right">
                      AMOUNT
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      STATUS
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase text-right">
                      DEFENSE STATUS
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-ink dark:text-slate-100 bg-white dark:bg-slate-900 divide-y divide-border-subtle dark:divide-slate-800">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg" /></td>
                        <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto bg-slate-100 dark:bg-slate-800 rounded-lg" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" /></td>
                        <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-24 ml-auto bg-slate-100 dark:bg-slate-800 rounded-lg" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-slate">
                        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-muted-slate">
                            <FileQuestion className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink dark:text-white text-sm">
                              No transactions found
                            </p>
                            <p className="text-xs text-muted-slate mt-0.5">
                              No payments match your current query or filter status.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setFilterStatus("all");
                              setSearch("");
                            }}
                            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container cursor-pointer shadow-xs"
                          >
                            Reset Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-xs text-primary">
                          {tx.paymentId}
                        </td>
                        <td className="py-3.5 px-4 text-muted-slate text-xs font-mono tabular-nums">{tx.date}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-xs text-ink dark:text-white">
                            {tx.customerName}
                          </div>
                          <div className="text-xs text-muted-slate truncate max-w-xs">
                            {tx.item}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-xs text-right text-ink dark:text-white">
                          ₹{((tx.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          {tx.status === "captured" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                              CAPTURED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800">
                              DISPUTED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {tx.disputeId ? (
                            <Link
                              href="/disputes"
                              className="inline-flex items-center gap-1 text-primary hover:text-primary-container text-xs font-semibold"
                            >
                              <span>Review Defense</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-slate/60">
                              No Dispute
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3.5 border-t border-border-subtle dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <span className="text-xs text-muted-slate font-mono tabular-nums">
                Showing {filtered.length} of {transactions.length} payments
              </span>
              <div className="flex gap-1">
                <button
                  className="p-1.5 rounded-lg text-muted-slate hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  disabled
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 rounded-lg text-muted-slate hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  disabled
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <UploadStatementModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            onUploadSuccess={loadTransactions}
          />
        </motion.div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
