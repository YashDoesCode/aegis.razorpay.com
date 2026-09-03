"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  ShieldCheck,
  TrendingUp,
  Gavel,
  AlertCircle,
  Zap,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";

export default function OverviewPage() {
  const { mode } = useMerchantMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCount: 6,
    totalPendingAmount: 6169800,
    high: { count: 4, amount: 5449900 },
    needsEvidence: { count: 0, amount: 0 },
    low: { count: 2, amount: 719900 },
  });

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/disputes?mode=${mode}`);
      const json = await res.json();
      if (json.ok && json.stats) {
        setStats(json.stats);
      } else if (!json.ok) {
        setError(json.error || "Failed to load overview metrics");
      }
    } catch (err) {
      console.error("Error loading stats:", err);
      setError("Unable to connect to dispute defense metrics");
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
          if (json.ok && json.stats) {
            setStats(json.stats);
          } else if (!json.ok) {
            setError(json.error || "Failed to load overview metrics");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading stats:", err);
          setError("Unable to connect to dispute defense metrics");
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

  const totalINR = ((stats.totalPendingAmount || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const recoverableINR = ((stats.high.amount || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const winRate =
    stats.totalCount > 0
      ? ((stats.high.count / stats.totalCount) * 100).toFixed(1)
      : "0.0";

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Overview Metrics Unavailable">
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
                Dispute Defense Overview
              </h1>
              <p className="text-xs text-muted-slate mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  NPCI UPI 2.0 & Card Chargeback Management · Connected to Razorpay {mode === "live" ? "Live Account" : "Sandbox"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/disputes"
                className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-sm font-semibold transition-colors h-9 shadow-xs cursor-pointer"
              >
                <Gavel className="w-4 h-4" />
                <span>Open Defense Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* High Level KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-3">
                  <Skeleton className="h-3 w-28 bg-slate-100" />
                  <Skeleton className="h-7 w-32 bg-slate-100" />
                  <Skeleton className="h-3 w-36 bg-slate-100" />
                </div>
              ))
            ) : (
              <>
                <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between text-muted-slate text-[11px] font-semibold uppercase tracking-wider">
                    <span>Total Volume At Risk</span>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-ink mt-2 tracking-tight">
                    ₹{totalINR}
                  </div>
                  <div className="text-xs text-muted-slate mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">{stats.totalCount}</span>
                    <span>active dispute records</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between text-muted-slate text-[11px] font-semibold uppercase tracking-wider">
                    <span>Recoverable Capital</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-emerald-600 mt-2 tracking-tight">
                    ₹{recoverableINR}
                  </div>
                  <div className="text-xs text-muted-slate mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-emerald-700">{stats.high.count} files</span>
                    <span>with verified proof</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between text-muted-slate text-[11px] font-semibold uppercase tracking-wider">
                    <span>Projected Win Rate</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-primary mt-2 tracking-tight">
                    {winRate}%
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Deterministic acquiring evidence score
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between text-muted-slate text-[11px] font-semibold uppercase tracking-wider">
                    <span>Defense Engine</span>
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-ink mt-2 tracking-tight flex items-center gap-2">
                    <span>Active</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Razorpay Staged Draft Mode enabled
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Operational Workflow Card */}
          <div className="bg-white rounded-[4px] border border-border-subtle p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Dispute Defense Architecture & Lifecycle
                </h2>
                <p className="text-xs text-muted-slate mt-0.5">
                  Autonomous evidence gathering, scoring, and representment staging across Indian payment rails
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-[4px] bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                72-Hour Bank SLA Monitoring
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
              <div className="space-y-1.5 p-4 rounded-[4px] bg-surface border border-border-subtle">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>1. 72-Hour SLA Ingestion</span>
                </div>
                <p className="text-xs text-muted-slate leading-relaxed">
                  Real-time webhook sync captures disputes upon issuance. Eliminates 45-minute manual retrieval per dispute file.
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-[4px] bg-surface border border-border-subtle">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span>2. Deterministic Scoring</span>
                </div>
                <p className="text-xs text-muted-slate leading-relaxed">
                  Evaluates courier delivery PODs, OTP logs, 3DS liability shift, and refund records against exact NPCI & card rules.
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-[4px] bg-surface border border-border-subtle">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3. Staged Representment</span>
                </div>
                <p className="text-xs text-muted-slate leading-relaxed">
                  Drafts formal representment letters and stages evidence directly onto Razorpay Contest Dispute API in Draft mode.
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert Card */}
          {error && !loading && (
            <div className="bg-white rounded-[4px] border border-red-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[4px] bg-red-50 text-red-600 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm">
                    Metrics Sync Alert
                  </h3>
                  <p className="text-xs text-muted-slate mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={loadStats}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Breakdown & Reason Code Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Winnability Gauge Card */}
            <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Winnability Distribution
                </h2>
                <span className="text-xs font-semibold text-muted-slate font-mono">
                  {stats.totalCount} Active Files
                </span>
              </div>

              {loading ? (
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-4 w-full bg-slate-100" />
                  <Skeleton className="h-4 w-full bg-slate-100" />
                  <Skeleton className="h-4 w-full bg-slate-100" />
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        High Winnability (&ge;80%)
                      </span>
                      <span className="font-mono text-ink font-bold">
                        {stats.high.count} (
                        {stats.totalCount > 0
                          ? Math.round((stats.high.count / stats.totalCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{
                          width: `${
                            stats.totalCount > 0
                              ? (stats.high.count / stats.totalCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Needs Evidence (50–79%)
                      </span>
                      <span className="font-mono text-ink font-bold">
                        {stats.needsEvidence.count} (
                        {stats.totalCount > 0
                          ? Math.round(
                              (stats.needsEvidence.count / stats.totalCount) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{
                          width: `${
                            stats.totalCount > 0
                              ? (stats.needsEvidence.count / stats.totalCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        Low Winnability (&lt;50%)
                      </span>
                      <span className="font-mono text-ink font-bold">
                        {stats.low.count} (
                        {stats.totalCount > 0
                          ? Math.round((stats.low.count / stats.totalCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 transition-all duration-300"
                        style={{
                          width: `${
                            stats.totalCount > 0
                              ? (stats.low.count / stats.totalCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-border-subtle pt-4 text-xs text-muted-slate space-y-2">
                <p>
                  <strong>Recommendation:</strong> Auto-represent {stats.high.count} High Winnability cases immediately to recover{" "}
                  <strong className="text-slate-900 font-mono">₹{recoverableINR}</strong>.
                </p>
                <Link
                  href="/disputes"
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Review and contest in Defense Console &rarr;
                </Link>
              </div>
            </div>

            {/* Reason Code Knowledge Matrix */}
            <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                  Acquiring Rules & Reason Code Matrix
                </h2>
                <span className="text-xs text-primary font-semibold">
                  6 Configured Rule Engines
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      UPI 1064
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                      NPCI UPI 2.0
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    Goods / Services Not Received
                  </p>
                  <p className="text-[11px] text-muted-slate leading-relaxed">
                    Requires Proof of Delivery (POD) with customer OTP/signature & courier AWB tracking status.
                  </p>
                </div>

                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      Card 4837
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      VISA / MASTERCARD
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    No Cardholder Authorization
                  </p>
                  <p className="text-[11px] text-muted-slate leading-relaxed">
                    Requires 3DS OTP log, customer IP address match, and billing proof establishing 3DS liability shift.
                  </p>
                </div>

                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      UPI 108
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                      NPCI UPI 2.0
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    Beneficiary Not Credited
                  </p>
                  <p className="text-[11px] text-muted-slate leading-relaxed">
                    Requires Razorpay Settlement UTR, payment capture confirmation, and banking credit validation.
                  </p>
                </div>

                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      UPI 1061 / 1084
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                      NPCI UPI 2.0
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    Duplicate / Credit Not Processed
                  </p>
                  <p className="text-[11px] text-muted-slate leading-relaxed">
                    Requires distinct order IDs, separate items, or completed refund UTR confirmation logs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
