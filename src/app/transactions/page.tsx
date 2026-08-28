"use client";

import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";

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

const initialTransactions: TransactionItem[] = [
  {
    id: "ord_1064_001",
    paymentId: "pay_1064_xyz89",
    customerName: "Rahul Sharma",
    customerEmail: "rahul.sharma@example.com",
    item: "Sony WH-1000XM5 Noise-Cancelling Headphones",
    amount: 2499900,
    currency: "INR",
    status: "disputed",
    date: "2026-08-15",
    disputeId: "disp_1064_goods_not_received",
  },
  {
    id: "ord_108_002",
    paymentId: "pay_108_abc12",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@example.com",
    item: "Annual SaaS Subscription - Enterprise",
    amount: 850000,
    currency: "INR",
    status: "disputed",
    date: "2026-08-18",
    disputeId: "disp_108_beneficiary_not_credited",
  },
  {
    id: "ord_4837_003",
    paymentId: "pay_4837_card55",
    customerName: "Vikram Malhotra",
    customerEmail: "vikram.m@example.com",
    item: "Apple iPad Air M2 256GB WiFi",
    amount: 1500000,
    currency: "INR",
    status: "disputed",
    date: "2026-08-20",
    disputeId: "disp_4837_no_cardholder_auth",
  },
  {
    id: "ord_1061_004",
    paymentId: "pay_1061_ref77",
    customerName: "Ananya Iyer",
    customerEmail: "ananya.iyer@example.com",
    item: "Mechanical Gaming Keyboard RGB",
    amount: 600000,
    currency: "INR",
    status: "disputed",
    date: "2026-08-21",
    disputeId: "disp_1061_credit_not_processed",
  },
  {
    id: "ord_1084_005",
    paymentId: "pay_1084_dup99",
    customerName: "Amit Verma",
    customerEmail: "amit.verma@example.com",
    item: "Ergonomic Office Chair Mesh",
    amount: 399900,
    currency: "INR",
    status: "disputed",
    date: "2026-08-22",
    disputeId: "disp_1084_duplicate_processing",
  },
  {
    id: "ord_1062_006",
    paymentId: "pay_1062_desc33",
    customerName: "Sneha Reddy",
    customerEmail: "sneha.reddy@example.com",
    item: "4K HDR Video Capture Card",
    amount: 320000,
    currency: "INR",
    status: "disputed",
    date: "2026-08-23",
    disputeId: "disp_1062_goods_not_as_described",
  },
  {
    id: "ord_paid_007",
    paymentId: "pay_live_clean01",
    customerName: "Karan Singh",
    customerEmail: "karan.s@example.com",
    item: "Logitech MX Master 3S Mouse",
    amount: 899500,
    currency: "INR",
    status: "captured",
    date: "2026-08-24",
    disputeId: null,
  },
  {
    id: "ord_paid_008",
    paymentId: "pay_live_clean02",
    customerName: "Deepika Rao",
    customerEmail: "deepika.rao@example.com",
    item: "Dell UltraSharp 27-inch 4K Monitor",
    amount: 4299900,
    currency: "INR",
    status: "captured",
    date: "2026-08-25",
    disputeId: null,
  },
];

export default function TransactionsPage() {
  const [transactions] = useState<TransactionItem[]>(initialTransactions);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    // Simulate brief smooth hydration
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

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

  const handleExport = () => {
    try {
      if (filtered.length === 0) {
        toast.info("No matching transactions to export");
        return;
      }
      const blob = new Blob([JSON.stringify(filtered, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `razorpay-transactions-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} transaction records`);
    } catch (err) {
      console.error("❌ Export error:", err);
      toast.error("Failed to export transactions");
    }
  };

  return (
    <DashboardShell searchQuery={search} onSearchChange={setSearch}>
      <LocalErrorBoundary fallbackTitle="Transactions View Error">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-headline-lg text-[32px] text-ink font-semibold tracking-tight">
                Transactions
              </h1>
              <p className="text-xs text-muted-slate mt-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                <span>Payment records and dispute linkages across Razorpay gateway</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={loading || filtered.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-sm font-semibold transition-colors h-10 flat-shadow cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV/JSON</span>
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "captured", "disputed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  filterStatus === st
                    ? "bg-rp-navy text-white"
                    : "bg-white border border-border-subtle text-muted-slate hover:text-ink"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-[4px] border border-border-subtle flat-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface/50">
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      PAYMENT ID
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      DATE
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      CUSTOMER & ITEM
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      AMOUNT
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      STATUS
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase text-right">
                      AEGIS DEFENSE
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-ink bg-white">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="border-b border-border-subtle">
                        <td className="py-3 px-4"><Skeleton className="h-4 w-32 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-40 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-5 w-20 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-24 ml-auto bg-rp-bg-2" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-slate">
                        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                          <div className="p-3 bg-rp-bg-2 rounded-full text-muted-slate">
                            <FileQuestion className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink text-sm">
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
                            className="px-3 py-1.5 rounded-[4px] bg-primary text-white text-xs font-semibold hover:bg-primary-container cursor-pointer"
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
                        className="border-b border-border-subtle hover:bg-page-bg transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-ink">
                          {tx.paymentId}
                        </td>
                        <td className="py-3 px-4 text-muted-slate">{tx.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-xs text-ink">
                            {tx.customerName}
                          </div>
                          <div className="text-xs text-muted-slate truncate max-w-xs">
                            {tx.item}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-ink">
                          ₹{((tx.amount || 0) / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          {tx.status === "captured" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-success/10 text-success text-[11px] font-semibold">
                              CAPTURED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-danger/10 text-danger text-[11px] font-semibold">
                              DISPUTED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {tx.disputeId ? (
                            <Link
                              href="/disputes"
                              className="inline-flex items-center gap-1 text-primary hover:text-primary-container text-xs font-semibold"
                            >
                              <span>Defense File</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-slate/60">
                              No dispute
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-border-subtle flex justify-between items-center bg-white">
              <span className="text-xs text-muted-slate">
                Showing {filtered.length} of {transactions.length} payments
              </span>
              <div className="flex gap-1">
                <button
                  className="p-1 rounded-[4px] text-muted-slate hover:bg-surface-container-low disabled:opacity-50 cursor-pointer"
                  disabled
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="p-1 rounded-[4px] text-muted-slate hover:bg-surface-container-low disabled:opacity-50 cursor-pointer"
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
