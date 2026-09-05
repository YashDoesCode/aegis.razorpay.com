"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  ShieldAlert,
  FileCheck2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  RefreshCw,
  X,
} from "lucide-react";
import { safeStorage, STORAGE_KEYS } from "@/lib/storage/safeStorage";
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
      aria-label="Operational Context Sidebar"
      className={cn(
        "transition-all duration-200 shrink-0 flex flex-col",
        isOpen
          ? "w-full lg:w-72 xl:w-80"
          : "w-0 lg:w-11 overflow-hidden"
      )}
    >
      <div
        className={cn(
          "h-full rounded-xl border border-border flex flex-col transition-colors duration-200 overflow-hidden",
          "bg-slate-50 dark:bg-[#141414] [data-theme=amoled]:bg-[#050505]"
        )}
      >
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
          <div className={cn("flex items-center gap-2", !isOpen && "lg:hidden")}>
            <Activity className="w-4 h-4 text-muted-foreground stroke-[1.75]" />
            <span className="text-xs font-semibold text-foreground tracking-tight">
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
            aria-label={isOpen ? "Collapse information panel" : "Expand information panel"}
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
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            <div className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground" /> Operations Status
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                  {mode.toUpperCase()}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-foreground">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Active queue</span>
                  <span className="font-mono font-medium">{disputeSummary.total} disputes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Due within 24h</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                    {disputeSummary.urgent24h} urgent
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[11px]">Evidence ready</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {disputeSummary.completeEvidence} files
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" /> Recovery Cycle
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  {disputeSummary.winRate} win rate
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-base font-semibold font-mono text-foreground">
                  {disputeSummary.recoveredAmount}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Exposure target:</span>
                  <span className="font-mono text-foreground font-medium">
                    {disputeSummary.exposureAmount}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-muted-foreground" /> Risk Signals
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  3DS Shift Active
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">High risk concentration</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-medium">
                    2 cases
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Velocity spikes</span>
                  <span className="text-foreground font-mono font-medium">Normal</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <FileCheck2 className="w-3 h-3 text-muted-foreground" /> Evidence Pipeline
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  92% match
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span className="text-[11px]">Courier POD tracking</span>
                  <span className="font-mono text-foreground font-medium">BlueDart / Del</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px]">Tax invoices mapped</span>
                  <span className="font-mono text-foreground font-medium">100% matched</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-muted-foreground" /> Recent Activity
                </span>
              </div>
              <div className="space-y-2">
                {recentActivities.map((act) => (
                  <div key={act.id} className="text-xs space-y-0.5 border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-foreground">{act.action}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{act.time}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{act.entity}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center py-4 gap-4 text-muted-foreground">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand information panel"
              className="p-1.5 hover:text-foreground transition cursor-pointer"
            >
              <Activity className="w-4 h-4 stroke-[1.75]" />
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand information panel"
              className="p-1.5 hover:text-foreground transition cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 stroke-[1.75]" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand information panel"
              className="p-1.5 hover:text-foreground transition cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
