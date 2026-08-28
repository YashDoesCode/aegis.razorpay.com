"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  DisputeDetailSheet,
  DisputeDetailItem,
} from "@/components/disputes/dispute-detail-sheet";
import {
  Download,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle,
  FileQuestion,
  PlusCircle,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";

type SortField = "amount" | "winnability" | "date" | "id";
type SortDirection = "asc" | "desc";
type WinnabilityFilter = "all" | "high" | "needs_evidence" | "low";

export default function DisputesPage() {
  const { mode, setMode, merchant, setIsConnectModalOpen } = useMerchantMode();

  const [disputes, setDisputes] = useState<DisputeDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedDispute, setSelectedDispute] =
    useState<DisputeDetailItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Search, Filter, Sort, Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [winnabilityFilter, setWinnabilityFilter] =
    useState<WinnabilityFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [stats, setStats] = useState({
    totalCount: 0,
    totalPendingAmount: 0,
    high: { count: 0, amount: 0 },
    needsEvidence: { count: 0, amount: 0 },
    low: { count: 0, amount: 0 },
  });

  const loadDisputes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/disputes?mode=${mode}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setDisputes(json.data);
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        const errorMsg = json.error || "Failed to load dispute records";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("❌ [DisputesPage] Load error:", err);
      const errorMsg = "Unable to connect to dispute defense service";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`/api/disputes/sync?mode=${mode}`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        toast.success(json.message || "Disputes synced successfully from Razorpay API");
        await loadDisputes();
      } else {
        toast.error(json.error || "Dispute synchronization failed");
      }
    } catch (err) {
      console.error("❌ [DisputesPage] Sync error:", err);
      toast.error("Network error during dispute sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadReport = () => {
    try {
      if (disputes.length === 0) {
        toast.info("No dispute records to download");
        return;
      }

      const reportData = disputes.map((d) => ({
        disputeId: d.id,
        rzpDisputeId: d.rzpDisputeId,
        mode: d.dataSource === "seed" ? "test_seed" : "live_api",
        reasonCode: d.reasonCode,
        network: d.network,
        amountPaise: d.amount,
        amountINR: ((d.amount || 0) / 100).toFixed(2),
        status: d.status,
        phase: d.phase,
        winnabilityScore: d.winnability?.score,
        winnabilityBand: d.winnability?.band,
        recommendation: d.winnability?.recommendation,
        respondBy: d.respondBy,
        customer: d.order?.customer?.name,
        item: d.order?.item,
        evidenceVerifiedCount: d.evidenceItems?.filter((e) => e.present).length,
        totalEvidenceCount: d.evidenceItems?.length,
      }));

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `razorpay-aegis-disputes-${mode}-report-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Dispute defense ${mode.toUpperCase()} audit report downloaded`);
    } catch (err) {
      console.error("❌ Failed to download report:", err);
      toast.error("Failed to generate report file");
    }
  };

  const openDetail = (item: DisputeDetailItem) => {
    setSelectedDispute(item);
    setSheetOpen(true);
  };

  const handleCardFilterClick = (band: WinnabilityFilter) => {
    if (winnabilityFilter === band) {
      setWinnabilityFilter("all");
      toast.info("Cleared winnability filter");
    } else {
      setWinnabilityFilter(band);
      toast.info(`Filtered by ${band.replace("_", " ")} winnability`);
    }
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Disputes
  const filteredAndSortedDisputes = useMemo(() => {
    let result = [...disputes];

    // Filter by Winnability Band
    if (winnabilityFilter !== "all") {
      result = result.filter((d) => d.winnability?.band === winnabilityFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          (d.id && d.id.toLowerCase().includes(q)) ||
          (d.paymentId && d.paymentId.toLowerCase().includes(q)) ||
          (d.rzpDisputeId && d.rzpDisputeId.toLowerCase().includes(q)) ||
          (d.reasonCode && d.reasonCode.toLowerCase().includes(q)) ||
          (d.network && d.network.toLowerCase().includes(q)) ||
          (d.order?.customer?.name && d.order.customer.name.toLowerCase().includes(q)) ||
          (d.order?.item && d.order.item.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "amount") {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (sortField === "winnability") {
        const scoreA = a.winnability?.score ?? 0;
        const scoreB = b.winnability?.score ?? 0;
        comparison = scoreA - scoreB;
      } else if (sortField === "id") {
        comparison = (a.id || "").localeCompare(b.id || "");
      } else {
        // date
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [disputes, winnabilityFilter, searchQuery, sortField, sortDirection]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredAndSortedDisputes.length / pageSize) || 1;
  const paginatedDisputes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedDisputes.slice(start, start + pageSize);
  }, [filteredAndSortedDisputes, currentPage, pageSize]);

  return (
    <DashboardShell
      searchQuery={searchQuery}
      onSearchChange={(q) => {
        setSearchQuery(q);
        setCurrentPage(1);
      }}
    >
      <LocalErrorBoundary fallbackTitle="Dispute Console Error">
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
                Aegis — Dispute Defense
              </h1>
              <p className="text-xs text-muted-slate mt-1 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    mode === "live" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>
                  {mode === "live"
                    ? `Live Production Mode · Connected to ${merchant.name} (${merchant.merchantId})`
                    : "Test Sandbox Mode · 6 Seeded Sample Disputes"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing || loading}
                className="flex items-center gap-2 px-3 py-2 rounded-[4px] border border-border-subtle bg-white text-ink hover:bg-page-bg text-sm font-semibold transition-colors h-10 flat-shadow cursor-pointer disabled:opacity-50"
                title={`Sync latest disputes from Razorpay ${mode.toUpperCase()} API`}
              >
                <RefreshCw
                  className={`w-4 h-4 text-muted-slate ${
                    syncing ? "animate-spin text-primary" : ""
                  }`}
                />
                <span>{syncing ? "Syncing..." : "Sync from Razorpay"}</span>
              </button>

              <button
                onClick={handleDownloadReport}
                disabled={loading || disputes.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-sm font-semibold transition-colors h-10 flat-shadow cursor-pointer disabled:opacity-50"
              >
                <Download className="w-[18px] h-[18px]" />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          {/* Mode Context Banner */}
          {mode === "test" ? (
            <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-[4px] text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span>
                  <strong>Test Sandbox Mode:</strong> Showing 6 representative demo dispute cases with winnability scoring & AI rebuttal drafts.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!merchant.isConnected) {
                    setIsConnectModalOpen(true);
                  } else {
                    setMode("live");
                  }
                }}
                className="text-amber-800 underline font-semibold hover:text-amber-950 flex-shrink-0 ml-4 cursor-pointer"
              >
                {merchant.isConnected ? "Switch to Live Mode &rarr;" : "Connect Razorpay Account &rarr;"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-[4px] text-xs text-emerald-900">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                <span>
                  <strong>Live Mode Active:</strong> Direct queries to Razorpay API for merchant <span className="font-mono font-semibold">{merchant.merchantId}</span>. Never shows fake/mock data.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMode("test")}
                className="text-emerald-800 underline font-semibold hover:text-emerald-950 flex-shrink-0 ml-4 cursor-pointer"
              >
                Switch to Test Mode (Demo Data) &rarr;
              </button>
            </div>
          )}

          {/* Error Alert Card (if fetch failed) */}
          {error && !loading && (
            <div className="bg-white rounded-[4px] border border-danger/40 p-6 flat-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[4px] bg-danger/10 text-danger shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm">
                    Failed to Load Dispute Records
                  </h3>
                  <p className="text-xs text-muted-slate mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={loadDisputes}
                className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-colors flat-shadow cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="bg-white rounded-[4px] border border-border-subtle p-6 flat-shadow space-y-3">
                  <Skeleton className="h-4 w-28 bg-rp-bg-2" />
                  <Skeleton className="h-8 w-16 bg-rp-bg-2" />
                  <Skeleton className="h-3 w-40 bg-rp-bg-2" />
                </div>
                <div className="bg-white rounded-[4px] border border-border-subtle p-6 flat-shadow space-y-3">
                  <Skeleton className="h-4 w-28 bg-rp-bg-2" />
                  <Skeleton className="h-8 w-16 bg-rp-bg-2" />
                  <Skeleton className="h-3 w-40 bg-rp-bg-2" />
                </div>
                <div className="bg-white rounded-[4px] border border-border-subtle p-6 flat-shadow space-y-3">
                  <Skeleton className="h-4 w-28 bg-rp-bg-2" />
                  <Skeleton className="h-8 w-16 bg-rp-bg-2" />
                  <Skeleton className="h-3 w-40 bg-rp-bg-2" />
                </div>
              </>
            ) : (
              <>
                {/* High Winnability */}
                <div
                  onClick={() => handleCardFilterClick("high")}
                  className={`bg-white rounded-[4px] border p-6 flat-shadow cursor-pointer transition-all duration-200 hover:border-success/60 ${
                    winnabilityFilter === "high"
                      ? "border-success ring-2 ring-success/20 bg-success/5"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold tracking-wider text-muted-slate uppercase flex items-center gap-1.5">
                      <span>High Winnability</span>
                      {winnabilityFilter === "high" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-success text-white">
                          FILTER ACTIVE
                        </span>
                      )}
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full bg-success mt-1" />
                  </div>
                  <div className="font-headline-lg text-[32px] font-semibold text-ink leading-tight">
                    {stats.high.count}
                  </div>
                  <div className="text-sm text-muted-slate mt-2">
                    ₹{((stats.high.amount || 0) / 100).toLocaleString("en-IN")}{" "}
                    pending · Click to filter
                  </div>
                </div>

                {/* Needs Evidence */}
                <div
                  onClick={() => handleCardFilterClick("needs_evidence")}
                  className={`bg-white rounded-[4px] border p-6 flat-shadow cursor-pointer transition-all duration-200 hover:border-attention/60 ${
                    winnabilityFilter === "needs_evidence"
                      ? "border-attention ring-2 ring-attention/20 bg-attention/5"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold tracking-wider text-muted-slate uppercase flex items-center gap-1.5">
                      <span>Needs Evidence</span>
                      {winnabilityFilter === "needs_evidence" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-attention text-white">
                          FILTER ACTIVE
                        </span>
                      )}
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full bg-attention mt-1" />
                  </div>
                  <div className="font-headline-lg text-[32px] font-semibold text-ink leading-tight">
                    {stats.needsEvidence.count}
                  </div>
                  <div className="text-sm text-muted-slate mt-2">
                    ₹{((stats.needsEvidence.amount || 0) / 100).toLocaleString("en-IN")}{" "}
                    pending · Click to filter
                  </div>
                </div>

                {/* Low Winnability */}
                <div
                  onClick={() => handleCardFilterClick("low")}
                  className={`bg-white rounded-[4px] border p-6 flat-shadow cursor-pointer transition-all duration-200 hover:border-danger/60 ${
                    winnabilityFilter === "low"
                      ? "border-danger ring-2 ring-danger/20 bg-danger/5"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold tracking-wider text-muted-slate uppercase flex items-center gap-1.5">
                      <span>Low Winnability</span>
                      {winnabilityFilter === "low" && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-danger text-white">
                          FILTER ACTIVE
                        </span>
                      )}
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full bg-danger mt-1" />
                  </div>
                  <div className="font-headline-lg text-[32px] font-semibold text-ink leading-tight">
                    {stats.low.count}
                  </div>
                  <div className="text-sm text-muted-slate mt-2">
                    ₹{((stats.low.amount || 0) / 100).toLocaleString("en-IN")}{" "}
                    pending · Click to filter
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filter Pills / Active Search Bar */}
          {(winnabilityFilter !== "all" || searchQuery.trim()) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-slate">
                Active Filters:
              </span>
              {winnabilityFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-rp-navy text-white text-xs font-semibold">
                  <span>Band: {winnabilityFilter.replace("_", " ")}</span>
                  <button
                    onClick={() => setWinnabilityFilter("all")}
                    className="hover:text-danger cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-rp-bg-2 text-ink text-xs font-semibold border border-border-subtle">
                  <span>Query: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-danger cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setWinnabilityFilter("all");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-primary hover:underline ml-2 cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}

          {/* Data Table Container */}
          <div className="bg-white rounded-[4px] border border-border-subtle flat-shadow overflow-hidden">
            <div className="px-6 py-5 border-b border-border-subtle flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <h2 className="font-headline-sm text-xl font-semibold text-ink">
                  {mode === "live" ? "Live Account Disputes" : "Demo Sandbox Disputes"}
                </h2>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadDisputes}
                  className="p-1 text-muted-slate hover:text-ink transition-colors cursor-pointer rounded-[4px]"
                  title="Refresh disputes data"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  className="p-1 text-muted-slate hover:text-ink transition-colors cursor-pointer rounded-[4px]"
                  title="More options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface/50">
                    <th
                      onClick={() => handleSort("id")}
                      className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase cursor-pointer hover:text-ink select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>DISPUTE ID</span>
                        {sortField === "id" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("date")}
                      className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase cursor-pointer hover:text-ink select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>TRANSACTION DATE</span>
                        {sortField === "date" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" />
                          ))}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("amount")}
                      className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase cursor-pointer hover:text-ink select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>AMOUNT</span>
                        {sortField === "amount" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-slate/50" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase">
                      REASON
                    </th>
                    <th
                      onClick={() => handleSort("winnability")}
                      className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase cursor-pointer hover:text-ink select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>WINNABILITY</span>
                        {sortField === "winnability" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-slate/50" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold tracking-wider text-muted-slate uppercase text-right">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-ink bg-white">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="border-b border-border-subtle">
                        <td className="py-3 px-4"><Skeleton className="h-4 w-36 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-44 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-5 w-24 bg-rp-bg-2" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto bg-rp-bg-2" /></td>
                      </tr>
                    ))
                  ) : paginatedDisputes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-slate">
                        {mode === "live" ? (
                          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto p-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-ink text-sm">
                                No Live Disputes Found
                              </p>
                              <p className="text-xs text-muted-slate mt-1 leading-relaxed">
                                Connected merchant account <span className="font-mono font-medium text-slate-800">{merchant.merchantId}</span> has 0 active chargebacks or open disputes on Razorpay.
                              </p>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                              <button
                                onClick={handleSync}
                                className="px-3 py-1.5 rounded-[4px] bg-primary text-white text-xs font-semibold hover:bg-primary-container cursor-pointer"
                              >
                                Sync with Razorpay
                              </button>
                              <button
                                onClick={() => setMode("test")}
                                className="px-3 py-1.5 rounded-[4px] border border-border-subtle bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                              >
                                View Demo Disputes (Test Mode)
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                            <div className="p-3 bg-rp-bg-2 rounded-full text-muted-slate">
                              <FileQuestion className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-ink text-sm">
                                No disputes found
                              </p>
                              <p className="text-xs text-muted-slate mt-0.5">
                                {searchQuery || winnabilityFilter !== "all"
                                  ? "No dispute records match your current filter or search criteria."
                                  : "No active disputes in sandbox."}
                              </p>
                            </div>
                            {(searchQuery || winnabilityFilter !== "all") && (
                              <button
                                onClick={() => {
                                  setWinnabilityFilter("all");
                                  setSearchQuery("");
                                  setCurrentPage(1);
                                }}
                                className="px-3 py-1.5 rounded-[4px] bg-primary text-white text-xs font-semibold hover:bg-primary-container cursor-pointer"
                              >
                                Reset Filters
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedDisputes.map((d) => {
                      const score = d.winnability?.score ?? 0;
                      const band = d.winnability?.band ?? "low";
                      const isSeed = d.dataSource === "seed" || d.data_source === "seed" || mode === "test";

                      return (
                        <tr
                          key={d.id}
                          onClick={() => openDetail(d)}
                          className="border-b border-border-subtle hover:bg-surface/60 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-xs text-primary">
                            <div className="flex items-center gap-1.5">
                              <span>{d.rzpDisputeId || d.id}</span>
                              {isSeed ? (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-sans border border-slate-200">
                                  Demo
                                </span>
                              ) : (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-sans border border-emerald-300">
                                  Live
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-slate text-xs">
                            {new Date(d.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            ₹{((d.amount || 0) / 100).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-ink">
                                Code {d.reasonCode}
                              </span>
                              <span className="text-[11px] text-muted-slate">
                                {d.network?.toUpperCase()} Chargeback
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-[4px] ${
                                  band === "high"
                                    ? "bg-success/15 text-success border border-success/30"
                                    : band === "needs_evidence"
                                    ? "bg-attention/15 text-attention border border-attention/30"
                                    : "bg-danger/15 text-danger border border-danger/30"
                                }`}
                              >
                                {score}% · {band.replace("_", " ")}
                              </span>
                              {d.fraudSignal?.isRepeatDisputer && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200">
                                  Repeat Disputer
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(d);
                              }}
                              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                              Review & Defense &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredAndSortedDisputes.length > pageSize && (
              <div className="px-6 py-4 border-t border-border-subtle flex justify-between items-center bg-white text-xs text-muted-slate">
                <div>
                  Showing{" "}
                  <span className="font-semibold text-ink">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-ink">
                    {Math.min(currentPage * pageSize, filteredAndSortedDisputes.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-ink">
                    {filteredAndSortedDisputes.length}
                  </span>{" "}
                  disputes
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-[4px] border border-border-subtle hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-medium text-ink">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-[4px] border border-border-subtle hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Dispute Detail Sheet */}
        <DisputeDetailSheet
          dispute={selectedDispute}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDisputeUpdated={loadDisputes}
        />
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
