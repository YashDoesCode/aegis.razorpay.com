"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Network,
  Users,
  TrendingUp,
  Receipt,
  FileQuestion,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { FraudSignalCard } from "@/components/disputes/fraud-signal-card";
import {
  DisputeDetailSheet,
  DisputeDetailItem,
} from "@/components/disputes/dispute-detail-sheet";
import { cn } from "@/lib/utils";

type FraudFilter = "all" | "high" | "medium" | "clean";

export default function FraudEnginePage() {
  const { mode } = useMerchantMode();
  const [disputes, setDisputes] = useState<DisputeDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<FraudFilter>("all");
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDispute, setSheetDispute] = useState<DisputeDetailItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/disputes?mode=${mode}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setDisputes(json.data);
        if (json.data.length > 0 && !selectedDisputeId) {
          const firstHighRisk = json.data.find(
            (d: DisputeDetailItem) => d.fraudSignal?.band === "high"
          );
          setSelectedDisputeId(firstHighRisk?.id || json.data[0].id);
        }
      } else {
        const errorMsg = json.error || "Failed to load fraud risk data";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("FraudEnginePage load error:", err);
      const errorMsg = "Unable to connect to fraud intelligence service";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedDisputeId]);

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
            if (json.data.length > 0) {
              const firstHighRisk = json.data.find(
                (d: DisputeDetailItem) => d.fraudSignal?.band === "high"
              );
              setSelectedDisputeId(firstHighRisk?.id || json.data[0].id);
            }
          } else {
            setError(json.error || "Failed to load fraud risk data");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("FraudEnginePage init error:", err);
          setError("Unable to connect to fraud intelligence service");
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

  const metrics = useMemo(() => {
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let cleanCount = 0;
    let repeatDisputerCount = 0;
    let highRiskValue = 0;

    for (const d of disputes) {
      const band = d.fraudSignal?.band;
      if (band === "high") {
        highRiskCount += 1;
        highRiskValue += d.amount || 0;
      } else if (band === "medium") {
        mediumRiskCount += 1;
      } else {
        cleanCount += 1;
      }

      if (d.fraudSignal?.isRepeatDisputer) {
        repeatDisputerCount += 1;
      }
    }

    const total = disputes.length;
    const repeatRate = total > 0 ? Math.round((repeatDisputerCount / total) * 100) : 0;

    return {
      total,
      highRiskCount,
      mediumRiskCount,
      cleanCount,
      repeatDisputerCount,
      repeatRate,
      highRiskValue,
    };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const band = d.fraudSignal?.band;
      if (riskFilter === "high" && band !== "high") return false;
      if (riskFilter === "medium" && band !== "medium") return false;
      if (riskFilter === "clean" && band !== "low" && band !== "insufficient_signal") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const idMatch = d.id.toLowerCase().includes(q);
        const nameMatch = d.order?.customer?.name.toLowerCase().includes(q);
        const itemMatch = d.order?.item?.toLowerCase().includes(q);
        const rrnMatch = d.paymentId?.toLowerCase().includes(q);
        return idMatch || nameMatch || itemMatch || rrnMatch;
      }

      return true;
    });
  }, [disputes, riskFilter, searchQuery]);

  const activeDispute = useMemo(() => {
    if (!selectedDisputeId) return filteredDisputes[0] || null;
    return (
      disputes.find((d) => d.id === selectedDisputeId) ||
      filteredDisputes[0] ||
      null
    );
  }, [disputes, filteredDisputes, selectedDisputeId]);

  const handleOpenSheet = (d: DisputeDetailItem) => {
    setSheetDispute(d);
    setSheetOpen(true);
  };

  return (
    <DashboardShell
      searchQuery={searchQuery}
      onSearchChange={(q) => setSearchQuery(q)}
    >
      <LocalErrorBoundary fallbackTitle="Fraud Engine Error">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full space-y-5"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-950 dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4.5 h-4.5 stroke-[1.75]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Fraud Engine &amp; Repeat Disputer Telemetry
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Behavioral pattern detection, friendly-fraud scoring, and multi-entity relationship mapping
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                <span>Sync Telemetry</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Evaluated Disputes</span>
                <Receipt className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {metrics.total}
              </div>
              <p className="text-[10px] text-slate-400">
                100% telemetry coverage
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>High First-Party Risk</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                {metrics.highRiskCount}
              </div>
              <p className="text-[10px] text-slate-400">
                ₹{(metrics.highRiskValue / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} high risk
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Repeat Disputer Rate</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {metrics.repeatRate}%
              </div>
              <p className="text-[10px] text-slate-400">
                {metrics.repeatDisputerCount} customers with prior disputes
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Clean Customer Ratio</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {metrics.total > 0
                  ? `${Math.round((metrics.cleanCount / metrics.total) * 100)}%`
                  : "0%"}
              </div>
              <p className="text-[10px] text-slate-400">
                {metrics.cleanCount} low-risk accounts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setRiskFilter("all")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                      riskFilter === "all"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    All ({metrics.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter("high")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                      riskFilter === "high"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    )}
                  >
                    High ({metrics.highRiskCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter("medium")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                      riskFilter === "medium"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                    )}
                  >
                    Medium ({metrics.mediumRiskCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter("clean")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                      riskFilter === "clean"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                    )}
                  >
                    Clean ({metrics.cleanCount})
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                    >
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : filteredDisputes.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs">
                    <FileQuestion className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    No disputes match the active filter in {mode.toUpperCase()} mode.
                  </div>
                ) : (
                  filteredDisputes.map((d) => {
                    const isSelected = selectedDisputeId === d.id;
                    const band = d.fraudSignal?.band;
                    const isHigh = band === "high";
                    const isMedium = band === "medium";

                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDisputeId(d.id)}
                        className={cn(
                          "p-3.5 rounded-xl border transition-all cursor-pointer text-left relative",
                          isSelected
                            ? "border-blue-500 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {d.order?.customer?.name || "Customer"}
                              </span>
                              {d.fraudSignal?.isRepeatDisputer && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  Repeat
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                              {d.order?.item || `Dispute ${d.id}`}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              ₹{((d.amount || 0) / 100).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <span
                              className={cn(
                                "inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5",
                                isHigh
                                  ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                  : isMedium
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              )}
                            >
                              {band === "high"
                                ? "High Risk"
                                : band === "medium"
                                ? "Medium Risk"
                                : "Clean"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-[10px]">
                            Disputes: {d.order?.customer?.priorDisputesCount || 0} / Orders: {d.order?.customer?.priorOrdersCount || 0}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSheet(d);
                            }}
                            className="text-primary hover:underline font-semibold flex items-center gap-0.5 text-[11px] cursor-pointer"
                          >
                            <span>Defense File</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {activeDispute ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Active Telemetry Profile: {activeDispute.id} ({activeDispute.order?.customer?.name})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSheet(activeDispute)}
                      className="px-3 py-1 bg-slate-950 dark:bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-primary transition cursor-pointer"
                    >
                      Open Full Defense Sheet
                    </button>
                  </div>

                  <FraudSignalCard fraudSignal={activeDispute.fraudSignal} />
                </div>
              ) : (
                <div className="p-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-500 text-xs">
                  Select a dispute to view its fraud risk profile and relationship graph.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {sheetDispute && (
          <DisputeDetailSheet
            dispute={sheetDispute}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          />
        )}
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
