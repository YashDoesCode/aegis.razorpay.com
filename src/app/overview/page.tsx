"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function OverviewPage() {
  const [stats, setStats] = useState({
    totalCount: 6,
    totalPendingAmount: 6169800,
    high: { count: 4, amount: 5449900 },
    needsEvidence: { count: 0, amount: 0 },
    low: { count: 2, amount: 719900 },
  });

  useEffect(() => {
    fetch("/api/disputes")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && json.stats) {
          setStats(json.stats);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const totalINR = (stats.totalPendingAmount / 100).toLocaleString("en-IN");
  const recoverableINR = (stats.high.amount / 100).toLocaleString("en-IN");

  return (
    <DashboardShell>
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
              <span>Real-time dispute risk mitigation · Razorpay Connected</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/disputes"
              className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-primary text-white hover:bg-primary-container text-sm font-semibold transition-colors h-10 flat-shadow cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              <span>Go to Defense Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* High Level KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
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
              83.3%
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

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-success font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    High Winnability (&ge;80%)
                  </span>
                  <span className="text-ink font-bold">
                    {stats.high.count} (
                    {Math.round((stats.high.count / stats.totalCount) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-rp-bg-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${(stats.high.count / stats.totalCount) * 100}%`,
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
                    {stats.needsEvidence.count} (0%)
                  </span>
                </div>
                <div className="w-full h-2 bg-rp-bg-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-attention"
                    style={{
                      width: `${
                        (stats.needsEvidence.count / stats.totalCount) * 100
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
                    {Math.round((stats.low.count / stats.totalCount) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-rp-bg-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-danger"
                    style={{
                      width: `${(stats.low.count / stats.totalCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

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
    </DashboardShell>
  );
}
