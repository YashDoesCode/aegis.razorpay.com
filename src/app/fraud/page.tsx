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
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full space-y-5"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground leading-tight">
                  Fraud Engine &amp; Repeat Disputer Telemetry
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Behavioral pattern detection, friendly-fraud scoring, and multi-entity relationship mapping
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                <span>Sync Telemetry</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Evaluated Disputes</span>
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-semibold text-foreground tracking-tight">
                {metrics.total}
              </div>
              <p className="text-[10px] text-muted-foreground">
                100% telemetry coverage
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>High First-Party Risk</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl font-semibold text-rose-600 dark:text-rose-400 tracking-tight">
                {metrics.highRiskCount}
              </div>
              <p className="text-[10px] text-muted-foreground">
                ₹{(metrics.highRiskValue / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} high risk
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Repeat Disputer Rate</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-semibold text-amber-600 dark:text-amber-400 tracking-tight">
                {metrics.repeatRate}%
              </div>
              <p className="text-[10px] text-muted-foreground">
                {metrics.repeatDisputerCount} accounts with prior disputes
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Clean Customer Ratio</span>
                <Users className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {metrics.total > 0
                  ? `${Math.round((metrics.cleanCount / metrics.total) * 100)}%`
                  : "0%"}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {metrics.cleanCount} low-risk accounts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center bg-muted p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setRiskFilter("all")}
                    className={cn(
                      "px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
                      riskFilter === "all"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All ({metrics.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter("high")}
                    className={cn(
                      "px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
                      riskFilter === "high"
                        ? "bg-rose-500 text-white shadow-2xs"
                        : "text-muted-foreground hover:text-rose-600"
                    )}
                  >
                    High ({metrics.highRiskCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter("medium")}
                    className={cn(
                      "px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
                      riskFilter === "medium"
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "text-muted-foreground hover:text-amber-600"
                    )}
                  >
                    Medium ({metrics.mediumRiskCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter("clean")}
                    className={cn(
                      "px-2.5 py-1 rounded font-medium transition-colors cursor-pointer",
                      riskFilter === "clean"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-muted-foreground hover:text-emerald-600"
                    )}
                  >
                    Clean ({metrics.cleanCount})
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-border bg-card space-y-2"
                    >
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : filteredDisputes.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/40 text-muted-foreground text-xs">
                    <FileQuestion className="w-5 h-5 mx-auto mb-2 opacity-50" />
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
                          "p-3 rounded-xl border transition-colors cursor-pointer text-left relative",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-2xs"
                            : "border-border bg-card hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs text-foreground">
                                {d.order?.customer?.name || "Customer"}
                              </span>
                              {d.fraudSignal?.isRepeatDisputer && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  Repeat
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {d.order?.item || `Dispute ${d.id}`}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-medium text-xs text-foreground">
                              ₹{((d.amount || 0) / 100).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <span
                              className={cn(
                                "inline-block text-[9px] font-medium px-1.5 py-0.5 rounded uppercase mt-0.5",
                                isHigh
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                  : isMedium
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
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

                        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-mono text-[10px]">
                            Disputes: {d.order?.customer?.priorDisputesCount || 0} / Orders: {d.order?.customer?.priorOrdersCount || 0}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSheet(d);
                            }}
                            className="text-primary hover:underline font-medium flex items-center gap-0.5 text-[11px] cursor-pointer"
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
                  <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Active Telemetry Profile: {activeDispute.id} ({activeDispute.order?.customer?.name})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSheet(activeDispute)}
                      className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                    >
                      Open Defense Sheet
                    </button>
                  </div>

                  <FraudSignalCard fraudSignal={activeDispute.fraudSignal} />
                </div>
              ) : (
                <div className="p-12 text-center border border-border rounded-xl bg-card text-muted-foreground text-xs">
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
