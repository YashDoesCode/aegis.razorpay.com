"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Activity,
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
          setDisputeSummary({
            total: d.openQueueCount + d.wonCount + d.highRiskCount,
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
              d.recentAuditFeed.slice(0, 4).map((a: { id: string; action: string; timeAgo: string; actor: string; targetId?: string }) => ({
                id: a.id,
                action: a.action,
                time: a.timeAgo,
                entity: a.targetId || a.actor,
              }))
            );
          }
        }
      })
      .catch(() => {});
  }, [mode]);

  return (
    <aside
      aria-label="Operational Context Rail"
      className={cn(
        "transition-all duration-200 shrink-0 flex flex-col",
        isOpen ? "w-full lg:w-72 xl:w-80" : "w-0 lg:w-9 overflow-hidden"
      )}
    >
      <div
        className={cn(
          "h-full rounded-xl border border-border flex flex-col transition-colors duration-200 overflow-hidden",
          "bg-card lg:bg-muted/20"
        )}
      >
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
          <div className={cn("flex items-center gap-2", !isOpen && "lg:hidden")}>
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
            aria-label={isOpen ? "Collapse contextual panel" : "Expand contextual panel"}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border transition cursor-pointer"
          >
            {isOpen ? (
              <ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2]" />
            )}
          </button>
        </div>

        {isOpen ? (
          <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 custom-scrollbar text-xs">
            <section className="space-y-1.5 pb-3 border-b border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Attention
                </span>
                <span className="font-mono text-[11px] text-foreground font-medium">
                  {mode.toUpperCase()}
                </span>
              </div>
              <div className="text-foreground font-medium text-xs">
                {disputeSummary.total} disputes need attention
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                {disputeSummary.urgent24h} due within 24h
              </div>
              <div className="text-[11px] text-muted-foreground">
                {disputeSummary.completeEvidence} evidence packets assembled
              </div>
            </section>

            <section className="space-y-1.5 pb-3 border-b border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Recovery
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  {disputeSummary.winRate} rate
                </span>
              </div>
              <div className="text-base font-semibold font-mono text-foreground">
                {disputeSummary.recoveredAmount}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Target exposure: <span className="font-mono text-foreground font-medium">{disputeSummary.exposureAmount}</span>
              </div>
            </section>

            <section className="space-y-1.5 pb-3 border-b border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Risk
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  3DS Shift
                </span>
              </div>
              <div className="text-foreground font-medium text-xs">
                {disputeSummary.highRiskCount} high-risk disputes
              </div>
              <div className="text-[11px] text-muted-foreground">
                {disputeSummary.velocityAlerts} velocity alerts active
              </div>
            </section>

            <section className="space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                Recent Activity
              </span>
              <div className="space-y-2">
                {recentActivities.map((act) => (
                  <div key={act.id} className="space-y-0.5 pb-1.5 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-foreground">{act.action}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{act.time}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{act.entity}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center py-3">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand operational context rail"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card rounded-md transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
