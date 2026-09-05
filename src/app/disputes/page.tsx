"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";

type SortField = "amount" | "winnability" | "date" | "id";
type SortDirection = "asc" | "desc";
type WinnabilityFilter = "all" | "high" | "needs_evidence" | "low";

function DisputesPageContent() {
  const searchParams = useSearchParams();
  const { mode, setMode, merchant, setIsConnectModalOpen } = useMerchantMode();

  const [disputes, setDisputes] = useState<DisputeDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const initialSearch = searchParams.get("search") || "";
  const initialFilter = searchParams.get("filter");
  const parsedFilter: WinnabilityFilter =
    initialFilter === "high" || initialFilter === "high_risk"
      ? "high"
      : initialFilter === "needs_evidence"
      ? "needs_evidence"
      : initialFilter === "low"
      ? "low"
      : "all";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [winnabilityFilter, setWinnabilityFilter] = useState<WinnabilityFilter>(parsedFilter);
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
      console.error("DisputesPage load error:", err);
      const errorMsg = "Unable to connect to dispute defense service";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        setError(null);
        const res = await fetch(`/api/disputes?mode=${mode}`);
        const json = await res.json();
        if (!ignore) {
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
        }
      } catch (err) {
        if (!ignore) {
          console.error("DisputesPage load error:", err);
          const errorMsg = "Unable to connect to dispute defense service";
          setError(errorMsg);
          toast.error(errorMsg);
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
      console.error("DisputesPage sync error:", err);
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
      toast.success(`Dispute defense audit report downloaded (${mode.toUpperCase()} mode)`);
    } catch (err) {
      console.error("Failed to download report:", err);
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

  const filteredAndSortedDisputes = useMemo(() => {
    let result = [...disputes];

    if (winnabilityFilter !== "all") {
      result = result.filter((d) => d.winnability?.band === winnabilityFilter);
    }

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
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [disputes, winnabilityFilter, searchQuery, sortField, sortDirection]);

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
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Disputes Defense Console
              </h1>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                <span
                  className={`w-2 h-2 rounded-full ${
                    mode === "live" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span>
                  {mode === "live"
                    ? `Live Production Mode · Connected to ${merchant.name} (${merchant.merchantId})`
                    : `Test Sandbox Mode · ${disputes.length || 10} Seeded Sample Disputes`}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSync}
                disabled={syncing || loading}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-medium transition-colors h-9 shadow-2xs cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
                title={`Sync latest disputes from Razorpay ${mode.toUpperCase()} API`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-muted-foreground ${
                    syncing ? "animate-spin text-primary" : ""
                  }`}
                />
                <span>{syncing ? "Syncing..." : "Sync Razorpay"}</span>
              </button>

              <button
                onClick={handleDownloadReport}
                disabled={loading || disputes.length === 0}
                className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-medium transition-colors h-9 shadow-2xs cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit</span>
              </button>
            </div>
          </div>

          {mode === "test" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong className="font-medium">Test Sandbox Mode:</strong> Showing {disputes.length || 10} representative demo dispute cases with winnability scoring & AI rebuttal drafts.
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
                className="text-amber-600 dark:text-amber-400 underline font-medium hover:opacity-80 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                {merchant.isConnected ? "Switch to Live Mode" : "Connect Razorpay Account"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong className="font-medium">Live Mode Active:</strong> Direct queries to Razorpay API for merchant <span className="font-mono font-medium">{merchant.merchantId}</span>. Never shows mock data.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMode("test")}
                className="text-emerald-600 dark:text-emerald-400 underline font-medium hover:opacity-80 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Switch to Test Mode
              </button>
            </div>
          )}

          {error && !loading && (
            <div className="bg-card rounded-xl border border-destructive/30 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-xs">
                    Failed to Load Dispute Records
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={loadDisputes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-card rounded-xl border border-border p-4 shadow-2xs space-y-2.5">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-7 w-16 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              ))
            ) : (
              <>
                <div
                  onClick={() => handleCardFilterClick("high")}
                  className={`bg-card rounded-xl border p-4 shadow-2xs cursor-pointer transition-colors ${
                    winnabilityFilter === "high"
                      ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-500/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5 flex-wrap">
                      <span>High Winnability (&ge;80%)</span>
                      {winnabilityFilter === "high" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono">
                          ACTIVE
                        </span>
                      )}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-0.5 shrink-0" />
                  </div>
                  <div className="font-mono tabular-nums text-xl font-semibold text-foreground">
                    {stats.high.count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-mono tabular-nums font-medium text-foreground">
                      ₹{((stats.high.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>{" "}
                    recoverable
                  </div>
                </div>

                <div
                  onClick={() => handleCardFilterClick("needs_evidence")}
                  className={`bg-card rounded-xl border p-4 shadow-2xs cursor-pointer transition-colors ${
                    winnabilityFilter === "needs_evidence"
                      ? "border-amber-500 ring-1 ring-amber-500/20 bg-amber-500/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5 flex-wrap">
                      <span>Needs Evidence (50–79%)</span>
                      {winnabilityFilter === "needs_evidence" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono">
                          ACTIVE
                        </span>
                      )}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-0.5 shrink-0" />
                  </div>
                  <div className="font-mono tabular-nums text-xl font-semibold text-foreground">
                    {stats.needsEvidence.count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-mono tabular-nums font-medium text-foreground">
                      ₹{((stats.needsEvidence.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>{" "}
                    pending
                  </div>
                </div>

                <div
                  onClick={() => handleCardFilterClick("low")}
                  className={`bg-card rounded-xl border p-4 shadow-2xs cursor-pointer transition-colors ${
                    winnabilityFilter === "low"
                      ? "border-rose-500 ring-1 ring-rose-500/20 bg-rose-500/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1.5 flex-wrap">
                      <span>Low Winnability (&lt;50%)</span>
                      {winnabilityFilter === "low" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono">
                          ACTIVE
                        </span>
                      )}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-rose-600 mt-0.5 shrink-0" />
                  </div>
                  <div className="font-mono tabular-nums text-xl font-semibold text-foreground">
                    {stats.low.count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-mono tabular-nums font-medium text-foreground">
                      ₹{((stats.low.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>{" "}
                    pending
                  </div>
                </div>
              </>
            )}
          </div>

          {(winnabilityFilter !== "all" || searchQuery.trim()) && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-medium text-muted-foreground">
                Active Filters:
              </span>
              {winnabilityFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
                  <span>Band: {winnabilityFilter.replace("_", " ")}</span>
                  <button
                    onClick={() => setWinnabilityFilter("all")}
                    className="hover:text-destructive cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
                  <span>Query: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-destructive cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setWinnabilityFilter("all");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="font-medium text-primary hover:underline ml-2 cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-card">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {mode === "live" ? "Live Razorpay Disputes" : "Demo Sandbox Disputes"}
                </h2>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={loadDisputes}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded hover:bg-muted"
                  title="Refresh disputes data"
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded hover:bg-muted"
                  title="More options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th
                      scope="col"
                      role="columnheader"
                      aria-sort={sortField === "id" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      tabIndex={0}
                      onClick={() => handleSort("id")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("id");
                        }
                      }}
                      className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    >
                      <div className="flex items-center gap-1">
                        <span>Dispute ID</span>
                        {sortField === "id" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      role="columnheader"
                      aria-sort={sortField === "date" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      tabIndex={0}
                      onClick={() => handleSort("date")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("date");
                        }
                      }}
                      className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        {sortField === "date" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      role="columnheader"
                      aria-sort={sortField === "amount" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      tabIndex={0}
                      onClick={() => handleSort("amount")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("amount");
                        }
                      }}
                      className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none focus:outline-none focus:ring-1 focus:ring-primary rounded text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Amount</span>
                        {sortField === "amount" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" aria-hidden="true" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Reason Code
                    </th>
                    <th
                      scope="col"
                      role="columnheader"
                      aria-sort={sortField === "winnability" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                      tabIndex={0}
                      onClick={() => handleSort("winnability")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort("winnability");
                        }
                      }}
                      className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    >
                      <div className="flex items-center gap-1">
                        <span>Winnability</span>
                        {sortField === "winnability" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" aria-hidden="true" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs text-foreground bg-card divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-32 rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-20 rounded" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-16 ml-auto rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-3.5 w-36 rounded" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20 rounded-full" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-3.5 w-16 ml-auto rounded" /></td>
                      </tr>
                    ))
                  ) : paginatedDisputes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        {mode === "live" ? (
                          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto p-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-xs">
                                No Live Disputes Found
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Connected merchant account <span className="font-mono font-medium text-foreground">{merchant.merchantId}</span> has 0 active chargebacks on Razorpay.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                              <button
                                onClick={handleSync}
                                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 cursor-pointer shadow-2xs"
                              >
                                Sync with Razorpay
                              </button>
                              <button
                                onClick={() => setMode("test")}
                                className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-medium cursor-pointer shadow-2xs"
                              >
                                View Demo Disputes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                            <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                              <FileQuestion className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-xs">
                                No disputes found
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
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
                                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 cursor-pointer shadow-2xs"
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
                          className="hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-4 font-mono font-medium text-xs text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span>{d.rzpDisputeId || d.id}</span>
                              {isSeed ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-sans border border-border">
                                  Demo
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans border border-emerald-500/20">
                                  Live
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground text-xs font-mono tabular-nums">
                            {new Date(d.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-2.5 px-4 font-mono tabular-nums font-medium text-xs text-right text-foreground">
                            ₹{((d.amount || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs text-foreground font-mono">
                                Code {d.reasonCode}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {d.network} Chargeback
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                                  band === "high"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : band === "needs_evidence"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                }`}
                              >
                                {score}% · {band.replace("_", " ")}
                              </span>
                              {d.fraudSignal?.isRepeatDisputer && (
                                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  Repeat
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(d);
                              }}
                              className="text-xs font-medium text-primary hover:underline cursor-pointer"
                            >
                              Review &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredAndSortedDisputes.length > pageSize && (
              <div className="px-4 py-2.5 border-t border-border flex flex-col sm:flex-row justify-between items-center bg-card text-xs text-muted-foreground gap-2">
                <div>
                  Showing{" "}
                  <span className="font-medium text-foreground font-mono tabular-nums">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground font-mono tabular-nums">
                    {Math.min(currentPage * pageSize, filteredAndSortedDisputes.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground font-mono tabular-nums">
                    {filteredAndSortedDisputes.length}
                  </span>{" "}
                  disputes
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-medium text-foreground font-mono tabular-nums">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

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

export default function DisputesPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen p-8 bg-background" />}>
      <DisputesPageContent />
    </Suspense>
  );
}
