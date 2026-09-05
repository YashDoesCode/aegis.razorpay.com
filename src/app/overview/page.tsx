"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCw,
  Download,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  Upload,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HealthScore } from "@/components/dashboard/health-score";
import { RecoveryMetric } from "@/components/dashboard/recovery-metric";
import { OperationalMetricGrid } from "@/components/dashboard/operational-metric-card";
import { ExposureRecoveryChart } from "@/components/dashboard/exposure-recovery-chart";
import { ActionQueue } from "@/components/dashboard/action-queue";
import { OperationalDeepDive } from "@/components/dashboard/operational-deep-dive";
import { WinnabilityDistribution } from "@/components/dashboard/winnability-distribution";
import { FraudRiskCard } from "@/components/dashboard/fraud-risk-card";
import { SignalsEvidenceCard } from "@/components/dashboard/signals-evidence-card";
import { UploadStatementModal } from "@/components/dashboard/upload-statement-modal";
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
import { DashboardOverviewData, TimeRangeOption } from "@/lib/dashboard/service";

export default function OverviewPage() {
  const router = useRouter();
  const { mode } = useMerchantMode();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>("All Disputes");
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>("30D");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [data, setData] = useState<DashboardOverviewData | null>(null);

  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/dashboard/overview?mode=${mode}&range=${selectedRange}`);
      const json = await res.json();
      if (json.ok && json.data) {
        setData(json.data);
        setError(null);
        if (isRefresh) {
          toast.success("Dispute operations data synced");
        }
      } else {
        const msg = json.error || "Failed to load overview metrics";
        setError(msg);
      }
    } catch (err) {
      console.error("Error loading overview:", err);
      setError("Unable to connect to dispute defense aggregation engine");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, selectedRange]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/dashboard/overview?mode=${mode}&range=${selectedRange}`);
        const json = await res.json();
        if (!ignore) {
          if (json.ok && json.data) {
            setData(json.data);
            setError(null);
          } else {
            setError(json.error || "Failed to load overview metrics");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading overview:", err);
          setError("Unable to connect to dispute defense aggregation engine");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [mode, selectedRange]);

  const handleExport = (format: "csv" | "json" | "pdf" | "docx" = "csv") => {
    try {
      toast.info(`Preparing ${format.toUpperCase()} export package...`);
      const exportUrl = `/api/export?type=overview&format=${format}&mode=${mode}`;
      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", `razorpay-aegis-overview-${mode}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        toast.success(`Dispute operations report (${format.toUpperCase()}) downloaded`);
      }, 500);
    } catch {
      toast.error("Failed to generate export file");
    }
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
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Dispute Operations Console
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time liability management, winnability analysis, and automated evidence pipelines.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <HealthScore score={data?.healthScore ?? 80} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Filter disputes: ${filterState}`}
                    className="flex items-center gap-1.5 bg-card hover:bg-muted border border-border px-2.5 py-1 rounded-lg text-xs font-medium text-foreground transition shadow-xs cursor-pointer outline-hidden focus-visible:ring-1 focus-visible:ring-foreground"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{filterState}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground stroke-[2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 p-1 rounded-xl shadow-lg border border-border bg-card text-xs"
                >
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("All Disputes")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer font-medium hover:bg-muted"
                  >
                    All Disputes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Open Queue")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted"
                  >
                    Open Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("High-Risk (<24h SLA)")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-muted"
                  >
                    High-Risk (&lt;24h SLA)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Evidence Gaps")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer text-amber-600 dark:text-amber-400 hover:bg-muted"
                  >
                    Evidence Gaps
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Won Disputes")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-muted"
                  >
                    Won Disputes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                aria-label="Upload Statement"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card hover:bg-muted border border-border text-xs font-medium text-foreground transition shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Upload Statement</span>
              </button>

              <button
                type="button"
                onClick={() => fetchOverview(true)}
                disabled={refreshing}
                aria-label="Refresh Data"
                className="w-7.5 h-7.5 rounded-lg bg-card hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 stroke-[1.75] ${
                    refreshing ? "animate-spin text-foreground" : ""
                  }`}
                />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Export Overview Report"
                    className="w-7.5 h-7.5 rounded-lg bg-card hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 p-1 rounded-xl shadow-lg border border-border bg-card text-xs"
                >
                  <DropdownMenuItem
                    onClick={() => handleExport("csv")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("json")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("pdf")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    Export as PDF (Printable)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("docx")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    Export as DOCX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </section>

          {error && !loading && (
            <div className="bg-rose-50/60 dark:bg-rose-950/40 rounded-xl border border-border p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <span className="font-semibold text-foreground">Sync Alert: </span>
                  <span className="text-muted-foreground">{error}</span>
                </div>
              </div>
              <button
                onClick={() => fetchOverview(true)}
                className="px-3 py-1 rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700 transition cursor-pointer shrink-0"
              >
                Retry Sync
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div
              id="tour-hero-metrics"
              className="lg:col-span-4 flex flex-col justify-between gap-3"
            >
              {loading ? (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <Skeleton className="h-3 w-28 bg-muted rounded" />
                  <Skeleton className="h-9 w-36 bg-muted rounded" />
                  <Skeleton className="h-3 w-48 bg-muted rounded" />
                </div>
              ) : (
                <RecoveryMetric
                  amount={data?.recoveredAmountPaise ?? 0}
                  displayAmount={data?.recoveredAmountFormatted ?? "₹0"}
                  trendPercent={data?.recoveryTrendPercent ?? 18.2}
                />
              )}

              {loading ? (
                <div className="grid grid-cols-2 gap-2.5 flex-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-card rounded-xl p-3 border border-border space-y-2"
                    >
                      <Skeleton className="h-3 w-16 bg-muted rounded" />
                      <Skeleton className="h-7 w-12 bg-muted rounded" />
                      <Skeleton className="h-3 w-20 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <OperationalMetricGrid
                  openQueueCount={data?.openQueueCount ?? 0}
                  highRiskCount={data?.highRiskCount ?? 0}
                  wonCount={data?.wonCount ?? 0}
                  winRatePercent={data?.winRatePercent ?? 0}
                  evidenceGapsCount={data?.evidenceGapsCount ?? 0}
                />
              )}
            </div>

            <div className="lg:col-span-8 flex">
              <ExposureRecoveryChart
                totalExposure={data?.totalExposureFormatted ?? "₹0"}
                recoveredAmount={data?.recoveredAmountFormatted ?? "₹0"}
                timeSeries={data?.timeSeries ?? []}
                selectedRange={selectedRange}
                onRangeChange={(r) => setSelectedRange(r)}
                className="w-full"
              />
            </div>
          </section>

          <ActionQueue
            dueTodayCount={data?.actionQueue.dueTodayCount ?? 0}
            evidenceGapsCount={data?.actionQueue.evidenceGapsCount ?? 0}
            highRiskCount={data?.actionQueue.highRiskCount ?? 0}
            courierEventsCount={data?.actionQueue.courierEventsCount ?? 0}
          />

          <OperationalDeepDive
            reasonCodeStats={data?.reasonCodeStats ?? []}
            recentAuditFeed={data?.recentAuditFeed ?? []}
            courierPerformance={data?.courierPerformance ?? []}
          />

          <section
            id="tour-winnability-risk"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch"
          >
            <div className="lg:col-span-5 flex">
              <WinnabilityDistribution
                strongPercent={data?.winnabilityDistribution.strongPercent ?? 0}
                moderatePercent={data?.winnabilityDistribution.moderatePercent ?? 0}
                weakPercent={data?.winnabilityDistribution.weakPercent ?? 0}
                unknownPercent={data?.winnabilityDistribution.unknownPercent ?? 0}
                confidenceScore={data?.winnabilityDistribution.confidenceScore ?? 80}
                className="w-full"
              />
            </div>

            <div className="lg:col-span-3 flex">
              <FraudRiskCard
                score={data?.fraudSummary.score ?? 50}
                statusText={data?.fraudSummary.statusText ?? "Clean transaction velocity"}
                stabilityDelta={data?.fraudSummary.stabilityDelta ?? 4}
                className="w-full"
              />
            </div>

            <div className="lg:col-span-4 flex">
              <SignalsEvidenceCard
                matchedDeliveryRate={data?.signalsEvidence.matchedDeliveryRate ?? 85}
                readinessBoost={data?.signalsEvidence.readinessBoost ?? 18}
                className="w-full"
              />
            </div>
          </section>

          <UploadStatementModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            onUploadSuccess={() => fetchOverview(true)}
          />
        </div>
      </LocalErrorBoundary>
    </DashboardShell>
  );
}
