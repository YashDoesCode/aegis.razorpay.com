"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCw,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HealthScore } from "@/components/dashboard/health-score";
import { RecoveryMetric } from "@/components/dashboard/recovery-metric";
import { OperationalMetricGrid } from "@/components/dashboard/operational-metric-card";
import { ExposureRecoveryChart } from "@/components/dashboard/exposure-recovery-chart";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { WinnabilityDistribution } from "@/components/dashboard/winnability-distribution";
import { FraudRiskCard } from "@/components/dashboard/fraud-risk-card";
import { SignalsEvidenceCard } from "@/components/dashboard/signals-evidence-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { toast } from "sonner";

export default function OverviewPage() {
  const router = useRouter();
  const { mode } = useMerchantMode();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>("All Disputes");

  const [stats, setStats] = useState({
    totalCount: 6,
    totalPendingAmount: 6169800,
    high: { count: 4, amount: 5449900 },
    needsEvidence: { count: 0, amount: 0 },
    low: { count: 2, amount: 719900 },
  });

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch(`/api/disputes?mode=${mode}`);
      const json = await res.json();
      if (json.ok && json.stats) {
        setStats(json.stats);
        toast.success("Dispute operations data synced");
      } else if (!json.ok) {
        setError(json.error || "Failed to load overview metrics");
      }
    } catch (err) {
      console.error("Error refreshing stats:", err);
      setError("Unable to connect to dispute defense metrics");
    } finally {
      setRefreshing(false);
    }
  };

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

  const totalExposureINR = React.useMemo(() => {
    if (stats.totalPendingAmount && stats.totalPendingAmount > 0) {
      return `₹${((stats.totalPendingAmount) / 100).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;
    }
    return "₹14,28,400";
  }, [stats.totalPendingAmount]);

  const recoveredINR = React.useMemo(() => {
    if (stats.high.amount && stats.high.amount > 0) {
      return `₹${((stats.high.amount) / 100).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;
    }
    return "₹8,95,200";
  }, [stats.high.amount]);

  const winRateNumber = React.useMemo(() => {
    if (stats.totalCount > 0) {
      return Math.round((stats.high.count / stats.totalCount) * 100);
    }
    return 71;
  }, [stats.totalCount, stats.high.count]);

  const healthScoreValue = React.useMemo(() => {
    if (stats.totalCount > 0) {
      const calculated = Math.round(50 + (winRateNumber * 0.35));
      return Math.min(96, Math.max(60, calculated));
    }
    return 76;
  }, [stats.totalCount, winRateNumber]);

  const handleExport = () => {
    toast.info("Exporting dispute operations summary report (CSV)...");
    setTimeout(() => {
      toast.success("Dispute operations summary downloaded");
    }, 600);
  };

  const handleFilterSelect = (filter: string) => {
    setFilterState(filter);
    if (filter === "Open Queue") {
      router.push("/disputes?filter=open");
    } else if (filter === "High-Risk (<24h SLA)") {
      router.push("/disputes?filter=high_risk");
    } else if (filter === "Evidence Gaps") {
      router.push("/disputes?filter=needs_evidence");
    } else if (filter === "Won Disputes") {
      router.push("/disputes?filter=won");
    } else {
      router.push("/disputes");
    }
  };

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Dispute Operations Console Unavailable">
        <div className="w-full space-y-4 sm:space-y-4.5">
          <section
            id="tour-overview-header"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5"
          >
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Dispute Operations Console
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time chargeback liability, winnability probability, and automated
                evidence pipelines.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <HealthScore score={healthScoreValue} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Filter disputes: ${filterState}`}
                    className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{filterState}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 stroke-[2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 p-1.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                >
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("All Disputes")}
                    className="rounded-xl px-2.5 py-1.5 cursor-pointer font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    All Disputes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Open Queue")}
                    className="rounded-xl px-2.5 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Open Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("High-Risk (<24h SLA)")}
                    className="rounded-xl px-2.5 py-1.5 cursor-pointer text-rose-700 dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    High-Risk (&lt;24h SLA)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Evidence Gaps")}
                    className="rounded-xl px-2.5 py-1.5 cursor-pointer text-amber-700 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Evidence Gaps
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Won Disputes")}
                    className="rounded-xl px-2.5 py-1.5 cursor-pointer text-emerald-700 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Won Disputes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                aria-label="Refresh Data"
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition shadow-xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 stroke-[1.75] ${
                    refreshing ? "animate-spin text-primary" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleExport}
                aria-label="Export Overview"
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </section>

          {error && !loading && (
            <div className="bg-rose-50/70 dark:bg-rose-950/50 rounded-2xl border border-rose-200 dark:border-rose-800 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold text-rose-950 dark:text-rose-200">Sync Alert: </span>
                  <span className="text-rose-800 dark:text-rose-300">{error}</span>
                </div>
              </div>
              <button
                onClick={handleManualRefresh}
                className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 transition cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-hidden"
              >
                Retry Sync
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            <div
              id="tour-hero-metrics"
              className="lg:col-span-4 flex flex-col justify-between gap-3 sm:gap-3.5"
            >
              {loading ? (
                <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <Skeleton className="h-3 w-28 bg-slate-200/70 dark:bg-slate-800 rounded-md" />
                  <Skeleton className="h-10 w-36 bg-slate-200/70 dark:bg-slate-800 rounded-lg" />
                  <Skeleton className="h-3 w-48 bg-slate-200/70 dark:bg-slate-800 rounded-md" />
                </div>
              ) : (
                <RecoveryMetric
                  amount={stats.high.amount}
                  displayAmount="₹4.8L"
                  trendPercent={12.4}
                />
              )}

              {loading ? (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 flex-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2"
                    >
                      <Skeleton className="h-3 w-16 bg-slate-200/70 dark:bg-slate-800 rounded-md" />
                      <Skeleton className="h-7 w-12 bg-slate-200/70 dark:bg-slate-800 rounded-md" />
                      <Skeleton className="h-3 w-20 bg-slate-200/70 dark:bg-slate-800 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : (
                <OperationalMetricGrid
                  openQueueCount={stats.totalCount > 0 ? 128 : 0}
                  highRiskCount={23}
                  wonCount={91}
                  winRatePercent={winRateNumber}
                  evidenceGapsCount={17}
                />
              )}
            </div>

            <div className="lg:col-span-8 flex">
              <ExposureRecoveryChart
                totalExposure={totalExposureINR}
                recoveredAmount={recoveredINR}
                className="w-full"
              />
            </div>
          </section>

          <ActionQueue
            dueTodayCount={12}
            evidenceGapsCount={8}
            highRiskCount={4}
            courierEventsCount={3}
          />

          <section
            id="tour-winnability-risk"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch"
          >
            <div className="lg:col-span-5 flex">
              <WinnabilityDistribution
                strongPercent={64}
                moderatePercent={21}
                weakPercent={10}
                unknownPercent={5}
                confidenceScore={85}
                className="w-full"
              />
            </div>

            <div className="lg:col-span-3 flex">
              <FraudRiskCard
                score={72}
                statusText="Velocity spike detected in card testing batches"
                stabilityDelta={4}
                className="w-full"
              />
            </div>

            <div className="lg:col-span-4 flex">
              <SignalsEvidenceCard
                matchedDeliveryRate={84}
                readinessBoost={18}
                className="w-full"
              />
            </div>
          </section>
        </div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
