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
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";
import { toast } from "sonner";

export default function OverviewPage() {
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
      const res = await fetch("/api/disputes");
      const json = await res.json();
      if (json.ok && json.stats) {
        setStats(json.stats);
      } else if (!json.ok) {
        setError(json.error || "Failed to load overview metrics");
      }
    } catch (err) {
      console.error("❌ [OverviewPage] Error loading stats:", err);
      setError("Unable to connect to dispute defense metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalINR = ((stats.totalPendingAmount || 0) / 100).toLocaleString("en-IN");
  const recoverableINR = ((stats.high.amount || 0) / 100).toLocaleString("en-IN");
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
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-headline-lg text-[32px] text-ink font-semibold tracking-tight">
                Aegis Overview
              </h1>
              <p className="text-xs text-muted-slate mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>Autonomous Dispute Defense & Win Engine · Razorpay Connected</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/disputes"
                className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-sm font-semibold transition-colors h-10 flat-shadow cursor-pointer"
              >
                <Gavel className="w-4 h-4" />
                <span>Launch Defense Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Hackathon Judge / Problem Brief Hero */}
          <div className="bg-white rounded-[4px] border border-primary/20 p-6 flat-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-[4px] bg-primary/10 text-primary border border-primary/20">
                  Razorpay Hackathon Prototype
                </span>
                <span className="text-[11px] font-semibold text-muted-slate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Live Neon Postgres & Razorpay Test-Mode Connected
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-slate">
                    1. The Problem
                  </div>
                  <h3 className="text-sm font-semibold text-ink">
                    3-Day Response Window & 12% Win Rate
                  </h3>
                  <p className="text-xs text-muted-slate leading-relaxed">
                    Chargebacks enforce a strict 3-day SLA. Manual retrieval of PODs, invoices, and buyer logs takes 45–60 min per dispute, causing merchants to lose legitimate revenue.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    2. The UPI-First Wedge
                  </div>
                  <h3 className="text-sm font-semibold text-ink">
                    First Engine Built for Indian Rails
                  </h3>
                  <p className="text-xs text-muted-slate leading-relaxed">
                    Global tools only support card chargebacks. Aegis natively understands NPCI UPI reason codes (1064, 108, 1084, 1061) plus Visa/Mastercard 4837 rules.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-success">
                    3. How Aegis Wins
                  </div>
                  <h3 className="text-sm font-semibold text-ink">
                    Deterministic Scoring & Staged Contest
                  </h3>
                  <p className="text-xs text-muted-slate leading-relaxed">
                    Scores evidence completeness, drafts LLM representments citing real proof, and stages drafts directly onto Razorpay’s real Contest Dispute API.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle text-xs">
                <span className="text-muted-slate">
                  Explore 6 seeded disputes with realistic winnability spread (94% to 23%).
                </span>
                <Link
                  href="/disputes"
                  className="font-semibold text-primary hover:text-primary-container inline-flex items-center gap-1.5"
                >
                  <span>View live dispute records & rebuttal engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Error Alert Card */}
          {error && !loading && (
            <div className="bg-white rounded-[4px] border border-danger/40 p-6 flat-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[4px] bg-danger/10 text-danger shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm">
                    Metrics Sync Warning
                  </h3>
                  <p className="text-xs text-muted-slate mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={loadStats}
                className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-colors flat-shadow cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Loading</span>
              </button>
            </div>
          )}

          {/* High Level KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow space-y-3">
                  <Skeleton className="h-4 w-28 bg-rp-bg-2" />
                  <Skeleton className="h-7 w-20 bg-rp-bg-2" />
                  <Skeleton className="h-3 w-32 bg-rp-bg-2" />
                </div>
              ))
            ) : (
              <>
                <div className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow">
                  <div className="flex items-center justify-between text-muted-slate text-xs font-semibold uppercase tracking-wider">
                    <span>Total Volume At Risk</span>
                    <AlertCircle className="w-4 h-4 text-attention" />
                  </div>
                  <div className="font-headline-lg text-2xl font-bold text-ink mt-2">
                    ₹{totalINR}
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Across {stats.totalCount} active chargebacks
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow">
                  <div className="flex items-center justify-between text-muted-slate text-xs font-semibold uppercase tracking-wider">
                    <span>Recoverable (High Win)</span>
                    <ShieldCheck className="w-4 h-4 text-success" />
                  </div>
                  <div className="font-headline-lg text-2xl font-bold text-success mt-2">
                    ₹{recoverableINR}
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    {stats.high.count} disputes with verified proof
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow">
                  <div className="flex items-center justify-between text-muted-slate text-xs font-semibold uppercase tracking-wider">
                    <span>Projected Win Rate</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="font-headline-lg text-2xl font-bold text-primary mt-2">
                    {winRate}%
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Deterministic evidence score
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow">
                  <div className="flex items-center justify-between text-muted-slate text-xs font-semibold uppercase tracking-wider">
                    <span>Auto-Defense Status</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="font-headline-lg text-2xl font-bold text-ink mt-2">
                    Active
                  </div>
                  <div className="text-xs text-muted-slate mt-1">
                    Draft mode representation enabled
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Breakdown Banner & Reason Code Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Winnability Gauge Card */}
            <div className="bg-white p-6 rounded-[4px] border border-border-subtle flat-shadow lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink text-base">
                  Winnability Distribution
                </h2>
                <span className="text-xs font-semibold text-muted-slate">
                  {stats.totalCount} Disputes
                </span>
              </div>

              {loading ? (
                <div className="space-y-4 pt-2">
                  <Skeleton className="h-4 w-full bg-rp-bg-2" />
                  <Skeleton className="h-4 w-full bg-rp-bg-2" />
                  <Skeleton className="h-4 w-full bg-rp-bg-2" />
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-success font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        High Winnability (&ge;80%)
                      </span>
                      <span className="text-ink font-bold">
                        {stats.high.count} (
                        {stats.totalCount > 0
                          ? Math.round((stats.high.count / stats.totalCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-rp-bg-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success transition-all duration-300"
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
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-attention font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-attention" />
                        Needs Evidence (50–79%)
                      </span>
                      <span className="text-ink font-bold">
                        {stats.needsEvidence.count} (
                        {stats.totalCount > 0
                          ? Math.round(
                              (stats.needsEvidence.count / stats.totalCount) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-rp-bg-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-attention transition-all duration-300"
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
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-danger font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-danger" />
                        Low Winnability (&lt;50%)
                      </span>
                      <span className="text-ink font-bold">
                        {stats.low.count} (
                        {stats.totalCount > 0
                          ? Math.round((stats.low.count / stats.totalCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-rp-bg-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-danger transition-all duration-300"
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
                  <strong>Recommendation:</strong> Auto-represent all{" "}
                  {stats.high.count} High Winnability cases immediately to recover{" "}
                  <strong>₹{recoverableINR}</strong>.
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
            <div className="bg-white p-6 rounded-[4px] border border-border-subtle flat-shadow lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink text-base">
                  Razorpay Reason Code Defense Rules
                </h2>
                <span className="text-xs text-primary font-semibold">
                  6 Standard Codes Configured
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      UPI 1064
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                      UPI
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    Goods / Services Not Received
                  </p>
                  <p className="text-[11px] text-muted-slate">
                    Requires Proof of Delivery (POD) with customer OTP/signature & courier AWB.
                  </p>
                </div>

                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      Card 4837
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                      CARD
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    No Cardholder Authorization
                  </p>
                  <p className="text-[11px] text-muted-slate">
                    Requires 3DS OTP log, IP address match, and billing proof.
                  </p>
                </div>

                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      UPI 108
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                      UPI
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    Beneficiary Not Credited
                  </p>
                  <p className="text-[11px] text-muted-slate">
                    Requires Razorpay Settlement UTR and payment capture confirmation.
                  </p>
                </div>

                <div className="p-3 rounded-[4px] border border-border-subtle bg-surface space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">
                      UPI 1061 / 1084
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                      UPI
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    Duplicate Processing / Refund
                  </p>
                  <p className="text-[11px] text-muted-slate">
                    Requires distinct order IDs, separate items, or refund UTR logs.
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
