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
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Transactions Ledger
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                <Receipt className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Payment records and dispute defense linkages across Razorpay gateway</span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-xs font-medium transition-colors h-9 shadow-2xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Import Statement</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport("csv")}
                disabled={loading || filtered.length === 0}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-medium transition-opacity h-9 shadow-2xs cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {["all", "captured", "disputed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wide transition-colors cursor-pointer ${
                  filterStatus === st
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Payment ID
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Date
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Customer &amp; Item
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase text-right">
                      Amount
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Status
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase text-right">
                      Defense Status
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs text-foreground bg-card divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-32 rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-24 rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-40 rounded" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20 rounded-full" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-24 ml-auto rounded" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                          <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                            <FileQuestion className="w-5 h-5 opacity-60" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">
                              No transactions found
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              No payments match your current query or filter status.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setFilterStatus("all");
                              setSearch("");
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 cursor-pointer shadow-2xs"
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
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-medium text-xs text-foreground">
                          {tx.paymentId}
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground text-xs font-mono tabular-nums">{tx.date}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-xs text-foreground">
                            {tx.customerName}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                            {tx.item}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums font-medium text-xs text-right text-foreground">
                          ₹{((tx.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4">
                          {tx.status === "captured" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                              Captured
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-medium border border-rose-500/20">
                              Disputed
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {tx.disputeId ? (
                            <Link
                              href="/disputes"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                            >
                              <span>Review Defense</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">
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

            <div className="px-4 py-2.5 border-t border-border flex justify-between items-center bg-card">
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                Showing {filtered.length} of {transactions.length} payments
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
