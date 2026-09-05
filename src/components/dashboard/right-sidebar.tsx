"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Activity,
  ArrowUpRight,
  Lightbulb,
} from "lucide-react";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function RightSidebar({ isOpen, onToggle }: RightSidebarProps) {
  const pathname = usePathname();
  const { mode } = useMerchantMode();
  const [viewMode, setViewMode] = useState<"volume" | "value">("volume");
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  const [winnability, setWinnability] = useState({
    strongPercent: 40,
    moderatePercent: 10,
    weakPercent: 50,
    unknownPercent: 0,
    confidenceScore: 70,
  });

  const [fraudSummary, setFraudSummary] = useState({
    score: 95,
    statusText: "Velocity spike detected in card testing batches",
    stabilityDelta: 4,
  });

  const [signalsEvidence, setSignalsEvidence] = useState({
    matchedDeliveryRate: 100,
    readinessBoost: 18,
  });

  const [disputeSummary, setDisputeSummary] = useState({
    total: 10,
    urgent24h: 2,
    completeEvidence: 4,
    underReview: 3,
    recoveredAmount: "₹4.83L",
    exposureAmount: "₹9.42L",
    winRate: "82.9%",
    highRiskCount: 5,
    velocityAlerts: 2,
  });

  const [recentActivities, setRecentActivities] = useState<
    { id: string; action: string; time: string; entity: string }[]
  >([
    {
      id: "act_1",
      action: "POD Auto-Attached",
      time: "10m ago",
      entity: "BlueDart POD-9821",
    },
    {
      id: "act_2",
      action: "Rebuttal Drafted",
      time: "24m ago",
      entity: "UPI 1064 (₹12,499)",
    },
    {
      id: "act_3",
      action: "Gateway Sync Completed",
      time: "1h ago",
      entity: "Razorpay Live Sync",
    },
    {
      id: "act_4",
      action: "Evidence Validated",
      time: "3h ago",
      entity: "GST Invoice INV-8821",
    },
  ]);

  useEffect(() => {
    fetch(`/api/dashboard/overview?mode=${mode}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && json.data) {
          const d = json.data;
          if (d.winnabilityDistribution) {
            setWinnability({
              strongPercent: d.winnabilityDistribution.strongPercent ?? 40,
              moderatePercent: d.winnabilityDistribution.moderatePercent ?? 10,
              weakPercent: d.winnabilityDistribution.weakPercent ?? 50,
              unknownPercent: d.winnabilityDistribution.unknownPercent ?? 0,
              confidenceScore: d.winnabilityDistribution.confidenceScore ?? 70,
            });
          }
          if (d.fraudSummary) {
            setFraudSummary({
              score: d.fraudSummary.score ?? 95,
              statusText:
                d.fraudSummary.statusText ??
                "Velocity spike detected in card testing batches",
              stabilityDelta: d.fraudSummary.stabilityDelta ?? 4,
            });
          }
          if (d.signalsEvidence) {
            setSignalsEvidence({
              matchedDeliveryRate: d.signalsEvidence.matchedDeliveryRate ?? 100,
              readinessBoost: d.signalsEvidence.readinessBoost ?? 18,
            });
          }
          setDisputeSummary({
            total: (d.openQueueCount ?? 0) + (d.wonCount ?? 0) + (d.highRiskCount ?? 0) || 10,
            urgent24h: d.actionQueue?.dueTodayCount ?? 2,
            completeEvidence: d.wonCount ?? 4,
            underReview: d.actionQueue?.evidenceGapsCount ?? 3,
            recoveredAmount: d.recoveredAmountFormatted ?? "₹4.83L",
            exposureAmount: d.totalExposureFormatted ?? "₹9.42L",
            winRate: `${d.winRatePercent ?? 82.9}%`,
            highRiskCount: d.highRiskCount ?? 5,
            velocityAlerts: 2,
          });
          if (Array.isArray(d.recentAuditFeed) && d.recentAuditFeed.length > 0) {
            setRecentActivities(
              d.recentAuditFeed
                .slice(0, 4)
                .map(
                  (a: {
                    id: string;
                    action: string;
                    timeAgo: string;
                    actor: string;
                    targetId?: string;
                  }) => ({
                    id: a.id,
                    action: a.action,
                    time: a.timeAgo,
                    entity: a.targetId || a.actor,
                  })
                )
            );
          }
        }
      })
      .catch(() => {});
  }, [mode]);

  if (!isOpen) return null;

  const bands = [
    {
      id: "strong",
      label: "Strong",
      sublabel: "≥80%",
      percent: winnability.strongPercent,
      colorClass: "bg-emerald-500",
    },
    {
      id: "moderate",
      label: "Moderate",
      sublabel: "50-79%",
      percent: winnability.moderatePercent,
      colorClass: "bg-slate-300 dark:bg-slate-200 text-slate-900",
    },
    {
      id: "weak",
      label: "Weak",
      sublabel: "<50%",
      percent: winnability.weakPercent,
      colorClass: "bg-rose-500",
    },
    {
      id: "unscored",
      label: "Unscored",
      sublabel: "SYNC",
      percent: winnability.unknownPercent,
      colorClass: "bg-muted-foreground/40",
    },
  ];

  return (
    <aside
      aria-label="Operational Context Rail"
      className="w-80 xl:w-88 shrink-0 flex flex-col"
    >
      <div className="h-full rounded-xl border border-border flex flex-col transition-colors duration-200 overflow-hidden bg-card lg:bg-muted/20">
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground stroke-[1.75]" />
            <span className="text-xs font-medium text-foreground tracking-tight">
              {pathname.includes("/disputes")
                ? "Dispute Intelligence"
                : pathname.includes("/fraud")
                ? "Risk Signals"
                : pathname.includes("/settlements")
                ? "Settlement Context"
                : pathname.includes("/settings")
                ? "System Status"
                : "Operations Context"}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse contextual panel"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border transition cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>

        <div
          id="tour-winnability-risk"
          className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3.5 custom-scrollbar text-xs"
        >
          <section className="bg-card rounded-xl p-3.5 border border-border flex flex-col justify-between shadow-xs transition-colors duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                  Winnability Distribution
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {winnability.confidenceScore}% confidence scoring distribution
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) => (prev === "volume" ? "value" : "volume"))
                }
                aria-label={`Toggle distribution view mode. Current: ${viewMode}`}
                className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-md shadow-xs transition cursor-pointer shrink-0"
              >
                <span>{viewMode === "volume" ? "By volume" : "By value"}</span>
                <ChevronDown className="w-2.5 h-2.5 stroke-[2]" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 items-end h-28 px-0.5 pb-1 pt-1 select-none">
              {bands.map((band) => (
                <div
                  key={band.id}
                  onPointerEnter={() => setHoveredBand(band.id)}
                  onPointerLeave={() => setHoveredBand(null)}
                  className="flex flex-col items-center h-full justify-end cursor-pointer"
                >
                  <div className="w-full bg-muted/40 rounded-lg p-1 flex flex-col justify-end h-full">
                    <div
                      className={cn(
                        "w-full rounded-md transition-all duration-300 p-1.5 flex flex-col justify-between shadow-xs",
                        band.colorClass,
                        band.id === "moderate" ? "text-slate-950" : "text-white",
                        hoveredBand === band.id
                          ? "opacity-100 ring-2 ring-foreground/20"
                          : "opacity-90"
                      )}
                      style={{ height: `${Math.max(22, band.percent)}%` }}
                    >
                      <span className="text-[11px] font-semibold font-mono leading-none">
                        {band.percent}%
                      </span>
                      <span className="text-[8px] font-medium opacity-80 uppercase font-mono leading-none mt-1">
                        {band.sublabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-foreground mt-1 truncate max-w-full text-center">
                    {band.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card rounded-xl p-3.5 border border-border flex flex-col justify-between shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                Risk Score
              </span>
              <Link
                href="/disputes?filter=high_risk"
                aria-label="Risk Details"
                className="w-5.5 h-5.5 rounded-md bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
              >
                <ArrowUpRight className="w-3 h-3 stroke-[2]" />
              </Link>
            </div>

            <div className="my-1.5">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
                  {fraudSummary.score}
                </span>
                <span className="text-muted-foreground text-xs font-normal ml-1 font-mono">
                  /100
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-normal mt-0.5 leading-snug">
                {fraudSummary.statusText}
              </p>
            </div>

            <div className="relative flex flex-col items-center justify-end overflow-hidden pt-1 select-none">
              <svg
                className="w-32 h-16 overflow-visible"
                viewBox="0 0 200 100"
                aria-hidden="true"
              >
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted"
                  strokeLinecap="round"
                  strokeWidth="10"
                />
                <path
                  d="M 20 100 A 80 80 0 0 1 135 28"
                  fill="none"
                  stroke="currentColor"
                  className="text-emerald-500"
                  strokeLinecap="round"
                  strokeWidth="10"
                />
                <circle
                  cx="135"
                  cy="28"
                  fill="var(--card)"
                  r="5"
                  stroke="currentColor"
                  className="text-foreground"
                  strokeWidth="2"
                />
              </svg>

              <p className="text-[10px] text-muted-foreground text-center mt-1 font-normal">
                Stability delta{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  +{fraudSummary.stabilityDelta}%
                </span>
              </p>
            </div>
          </section>

          <section className="bg-card rounded-xl p-3.5 border border-border shadow-xs space-y-3">
            <div className="space-y-1 pb-2.5 border-b border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Attention
                </span>
                <span className="font-mono text-[10px] text-foreground font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
                  {mode.toUpperCase()}
                </span>
              </div>
              <div className="text-foreground font-medium text-xs">
                {disputeSummary.total} disputes need attention
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {disputeSummary.urgent24h} due within 24h
              </div>
              <div className="text-[10px] text-muted-foreground">
                {disputeSummary.completeEvidence} evidence packets assembled
              </div>
            </div>

            <div className="space-y-1 pb-2.5 border-b border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Recovery
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  {disputeSummary.winRate} rate
                </span>
              </div>
              <div className="text-base font-semibold font-mono text-foreground">
                {disputeSummary.recoveredAmount}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Target exposure: <span className="font-mono text-foreground font-medium">{disputeSummary.exposureAmount}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Risk
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  3DS Shift
                </span>
              </div>
              <div className="text-foreground font-medium text-xs">
                {disputeSummary.highRiskCount} high-risk disputes
              </div>
              <div className="text-[10px] text-muted-foreground">
                {disputeSummary.velocityAlerts} velocity alerts active
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl p-3.5 border border-border flex flex-col justify-between shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-4.5 h-4.5 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                  <Lightbulb className="w-3 h-3 stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                  Signals &amp; Evidence
                </span>
              </div>

              <Link
                href="/settings"
                aria-label="Open Insights"
                className="w-5.5 h-5.5 rounded-md bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden"
              >
                <ArrowUpRight className="w-3 h-3 stroke-[2]" />
              </Link>
            </div>

            <div className="my-2">
              <p className="text-foreground text-[11px] leading-relaxed">
                Delivery confirmation matched for{" "}
                <strong className="font-medium text-foreground">
                  {signalsEvidence.matchedDeliveryRate}% of fulfillment disputes
                </strong>
                . Automated courier logs improved representment readiness by{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                  +{signalsEvidence.readinessBoost}%
                </span>
                .
              </p>
            </div>

            <div>
              <span className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wider block mb-1.5">
                Connected Pipelines
              </span>
              <div className="flex items-center flex-wrap gap-1">
                <div className="px-1.5 py-0.5 rounded-md bg-muted/60 border border-border text-[10px] font-medium text-foreground shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Razorpay Core
                </div>

                <div className="px-1.5 py-0.5 rounded-md bg-muted/60 border border-border text-[10px] font-medium text-foreground shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Carrier PoD
                </div>

                <div className="px-1.5 py-0.5 rounded-md bg-muted/60 border border-border text-[10px] font-medium text-foreground shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Shield Risk
                </div>

                <div className="px-1.5 py-0.5 rounded-md bg-muted/60 border border-border text-[10px] font-medium text-muted-foreground shadow-xs">
                  Card Schemes
                </div>
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl p-3.5 border border-border shadow-xs space-y-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Recent Activity
            </span>
            <div className="space-y-2">
              {recentActivities.map((act) => (
                <div key={act.id} className="space-y-0.5 pb-1.5 border-b border-border/40 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-foreground">{act.action}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{act.time}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{act.entity}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}
