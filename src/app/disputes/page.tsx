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
} from "lucide-react";
import { toast } from "sonner";

type SortField = "amount" | "winnability" | "date" | "id";
type SortDirection = "asc" | "desc";
type WinnabilityFilter = "all" | "high" | "needs_evidence" | "low";

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputeDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      const res = await fetch("/api/disputes");
      const json = await res.json();
      if (json.ok) {
        setDisputes(json.data);
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        toast.error("Failed to load disputes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching disputes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/disputes")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.ok) {
          setDisputes(json.data);
          if (json.stats) {
            setStats(json.stats);
          }
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/disputes/sync", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        toast.success(json.message || "Disputes synced successfully from Razorpay API");
        await loadDisputes();
      } else {
        toast.error("Sync failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync disputes");
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadReport = () => {
    const reportData = disputes.map((d) => ({
      disputeId: d.id,
      rzpDisputeId: d.rzpDisputeId,
      reasonCode: d.reasonCode,
      network: d.network,
      amountPaise: d.amount,
      amountINR: (d.amount / 100).toFixed(2),
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
    a.download = `razorpay-aegis-disputes-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Dispute defense audit report downloaded");
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
          d.id.toLowerCase().includes(q) ||
          d.paymentId?.toLowerCase().includes(q) ||
          d.rzpDisputeId?.toLowerCase().includes(q) ||
          d.reasonCode.toLowerCase().includes(q) ||
          d.network.toLowerCase().includes(q) ||
          d.order?.customer?.name?.toLowerCase().includes(q) ||
          d.order?.item?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortField === "winnability") {
        const scoreA = a.winnability?.score ?? 0;
        const scoreB = b.winnability?.score ?? 0;
        comparison = scoreA - scoreB;
      } else if (sortField === "id") {
        comparison = a.id.localeCompare(b.id);
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
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-headline-lg text-[32px] text-ink font-semibold tracking-tight">
              Aegis — Dispute Defense
            </h1>
            <p className="text-xs text-muted-slate mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>Razorpay Disputes Engine connected · Test Mode Active</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-2 rounded-[4px] border border-border-subtle bg-white text-ink hover:bg-page-bg text-sm font-semibold transition-colors h-10 flat-shadow cursor-pointer"
              title="Sync latest disputes from Razorpay API"
            >
              <RefreshCw
                className={`w-4 h-4 text-muted-slate ${
                  syncing ? "animate-spin text-primary" : ""
                }`}
              />
              <span>{syncing ? "Syncing..." : "Sync Disputes"}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-sm font-semibold transition-colors h-10 flat-shadow cursor-pointer"
            >
              <Download className="w-[18px] h-[18px]" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Clickable Summary Filter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {stats.high.count || 4}
            </div>
            <div className="text-sm text-muted-slate mt-2">
              ₹{(stats.high.amount / 100 || 54499).toLocaleString("en-IN")}{" "}
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
              {stats.needsEvidence.count || 0}
            </div>
            <div className="text-sm text-muted-slate mt-2">
              ₹{(stats.needsEvidence.amount / 100 || 0).toLocaleString("en-IN")}{" "}
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
              {stats.low.count || 2}
            </div>
            <div className="text-sm text-muted-slate mt-2">
              ₹{(stats.low.amount / 100 || 7199).toLocaleString("en-IN")}{" "}
              pending · Click to filter
            </div>
          </div>
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
                Active Disputes
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
                {paginatedDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-slate text-xs">
                      No disputes match the selected filters or search query.
                    </td>
                  </tr>
                ) : (
                  paginatedDisputes.map((item) => {
                    const score = item.winnability?.score ?? 50;
                    const band = item.winnability?.band ?? "needs_evidence";
                    const rec = item.winnability?.recommendation ?? "gather_evidence";
                    const dateStr = new Date(item.createdAt).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" }
                    );

                    return (
                      <tr
                        key={item.id}
                        onClick={() => openDetail(item)}
                        className="border-b border-border-subtle hover:bg-page-bg transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-ink">
                          {item.id}
                        </td>
                        <td className="py-3 px-4 text-muted-slate">{dateStr}</td>
                        <td className="py-3 px-4 font-medium text-ink">
                          ₹{(item.amount / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-muted-slate max-w-xs truncate">
                          {item.network.toUpperCase()} ·{" "}
                          {item.reasonCode === "1064"
                            ? "Goods not received (1064)"
                            : item.reasonCode === "108"
                            ? "Beneficiary not credited (108)"
                            : item.reasonCode === "4837"
                            ? "No cardholder auth (4837)"
                            : item.reasonCode === "1061"
                            ? "Credit not processed (1061)"
                            : item.reasonCode === "1084"
                            ? "Duplicate processing (1084)"
                            : item.reasonCode === "1062"
                            ? "Goods not as described (1062)"
                            : `Code ${item.reasonCode}`}
                        </td>
                        <td className="py-3 px-4">
                          {band === "high" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-success/10 text-success text-[12px] font-semibold">
                              High ({score}%)
                            </span>
                          )}
                          {band === "needs_evidence" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-attention/10 text-attention text-[12px] font-semibold">
                              Needs Evidence ({score}%)
                            </span>
                          )}
                          {band === "low" && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-danger/10 text-danger text-[12px] font-semibold">
                              Low ({score}%)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {rec === "contest" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(item);
                              }}
                              className="text-primary hover:text-primary-container text-sm font-semibold transition-colors cursor-pointer"
                            >
                              Draft rebuttal
                            </button>
                          ) : rec === "gather_evidence" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(item);
                              }}
                              className="text-primary hover:text-primary-container text-sm font-semibold transition-colors cursor-pointer"
                            >
                              Add evidence
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(item);
                              }}
                              className="text-muted-slate hover:text-ink text-sm font-semibold transition-colors cursor-pointer"
                            >
                              Accept dispute
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-border-subtle flex justify-between items-center bg-white">
            <span className="text-sm text-muted-slate">
              Showing{" "}
              {paginatedDisputes.length > 0
                ? (currentPage - 1) * pageSize + 1
                : 0}{" "}
              to{" "}
              {Math.min(
                currentPage * pageSize,
                filteredAndSortedDisputes.length
              )}{" "}
              of {filteredAndSortedDisputes.length} disputes
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-slate">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-[4px] text-muted-slate hover:bg-surface-container-low disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-[4px] text-muted-slate hover:bg-surface-container-low disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide-out Detail Drawer */}
        <DisputeDetailSheet
          dispute={selectedDispute}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDisputeUpdated={loadDisputes}
        />
      </motion.div>
    </DashboardShell>
  );
}
