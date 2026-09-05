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
    } catch {
      setError("Network or server connection failed");
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [mode, selectedRange]);

  useEffect(() => {
    fetchOverview(false);
  }, [fetchOverview]);

  const handleManualRefresh = () => {
    fetchOverview(true);
  };

  const handleFilterSelect = (filterName: string) => {
    setFilterState(filterName);
    if (filterName === "High Risk Only") {
      router.push("/disputes?filter=high_risk");
    } else if (filterName === "Action Required") {
      router.push("/disputes?filter=action_required");
    } else if (filterName === "Under Review") {
      router.push("/disputes?filter=under_review");
    } else if (filterName === "Won Disputes") {
      router.push("/disputes?filter=won");
    } else {
      router.push("/disputes");
    }
  };

  const handleExport = async (format: "csv" | "json" | "pdf" | "docx") => {
    try {
      toast.info(`Preparing ${format.toUpperCase()} export...`);
      const res = await fetch(`/api/export?format=${format}&mode=${mode}&range=${selectedRange}`);
      if (!res.ok) {
        throw new Error("Export generation failed");
      }

      if (format === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `razorpay-aegis-disputes-${mode}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === "json") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `razorpay-aegis-disputes-${mode}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === "docx") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `razorpay-aegis-summary-${mode}-${Date.now()}.doc`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === "pdf") {
        const html = await res.text();
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        }
      }

      toast.success(`Dispute operations report (${format.toUpperCase()}) downloaded`);
    } catch {
      toast.error("Failed to generate export file");
    }
  };

  return (
    <DashboardShell>
      <LocalErrorBoundary fallbackTitle="Dispute Operations Console Unavailable">
        <div className="space-y-4 w-full">
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full shrink-0" />
              <div>
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                  Dispute Operations Console
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Autonomous winnability modeling, proof-of-delivery sync &amp; multi-channel representment
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <HealthScore
                score={data?.healthScore ?? 94}
                activeShiftProtection={data?.activeProtection ?? true}
              />

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                aria-label="Synchronize Gateway Data"
                className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`}
                />
                <span className="hidden sm:inline">Sync Data</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                aria-label="Upload Settlement or Dispute Statement"
                className="px-2.5 py-1 text-xs font-medium text-primary hover:text-primary-foreground hover:bg-primary bg-primary/10 border border-primary/20 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Statement</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Filter Disputes Context"
                    className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{filterState}</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 text-xs p-1 rounded-xl shadow-lg border border-border bg-card"
                >
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("All Disputes")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    All Active Disputes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Action Required")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    Action Required (Urgent)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("High Risk Only")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    High Risk Flagged
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Under Review")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    Under Gateway Review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterSelect("Won Disputes")}
                    className="rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted font-medium"
                  >
                    Successfully Won
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Download Audit or Rebuttal Reports"
                    className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 text-xs p-1 rounded-xl shadow-lg border border-border bg-card"
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
