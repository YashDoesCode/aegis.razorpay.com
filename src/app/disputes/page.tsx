"use client";

import React from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
} from "lucide-react";

export default function DisputesPage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-medium text-2xl tracking-tight text-rp-ink-black">
                Disputes & Chargebacks
              </h1>
              <Badge variant="ai" className="rounded-[4px] px-2.5 py-0.5 font-semibold shadow-2xs">
                <Sparkles className="w-3 h-3 mr-1 text-rp-blue" />
                AI Active
              </Badge>
            </div>
            <p className="text-sm font-sans text-rp-muted mt-1">
              Autonomous dispute defense layer on top of Razorpay's Contest & Evidence APIs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Secondary Button */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-[4px] bg-rp-surface text-rp-blue border-rp-border hover:bg-rp-bg-2 hover:text-rp-blue-hover font-medium rp-shadow-soft"
            >
              Sync Disputes
            </Button>
            {/* Primary Button */}
            <Button
              size="sm"
              className="rounded-[4px] bg-rp-blue hover:bg-rp-blue-hover text-white font-medium rp-shadow-soft"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Batch Auto-Contest
            </Button>
          </div>
        </div>

        {/* Overview Metric Cards (12px-based padding & 4px radius) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Safe / Won Metric */}
          <Card className="bg-rp-surface border-rp-border rounded-[4px] rp-shadow-soft">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-rp-muted uppercase tracking-wider">
                  High Winnability (≥80%)
                </span>
                <div className="font-display font-semibold text-2xl text-rp-ink-black">
                  14 <span className="font-sans text-xs font-normal text-rp-muted-2">disputes</span>
                </div>
                <div className="text-xs text-rp-muted">
                  ₹48,250 recoverable
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-rp-green-tint text-rp-green border border-[#00A25133]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Safe to Contest
              </span>
            </CardContent>
          </Card>

          {/* Attention Metric */}
          <Card className="bg-rp-surface border-rp-border rounded-[4px] rp-shadow-soft">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-rp-muted uppercase tracking-wider">
                  Needs Evidence (50-79%)
                </span>
                <div className="font-display font-semibold text-2xl text-rp-ink-black">
                  6 <span className="font-sans text-xs font-normal text-rp-muted-2">disputes</span>
                </div>
                <div className="text-xs text-rp-muted">
                  ₹18,900 pending proofs
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Attention
              </span>
            </CardContent>
          </Card>

          {/* At Risk Metric */}
          <Card className="bg-rp-surface border-rp-border rounded-[4px] rp-shadow-soft">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-rp-muted uppercase tracking-wider">
                  Low Winnability (&lt;50%)
                </span>
                <div className="font-display font-semibold text-2xl text-rp-ink-black">
                  3 <span className="font-sans text-xs font-normal text-rp-muted-2">disputes</span>
                </div>
                <div className="text-xs text-rp-muted">
                  ₹9,100 high risk
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-rp-red-tint/35 text-rp-red border border-[#ED293933]">
                <XCircle className="w-3.5 h-3.5" />
                At Risk / Lost
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Feature Workspace & Sample Status Table */}
        <Card className="bg-rp-surface border-rp-border rounded-[4px] rp-shadow-soft overflow-hidden">
          <CardHeader className="border-b border-rp-border bg-rp-bg-2 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-[4px] bg-rp-blue-bg text-rp-blue border border-rp-blue/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-tight font-semibold text-base text-rp-ink-black">
                    Disputes Pipeline & Winnability Matrix
                  </h2>
                  <CardDescription className="text-xs text-rp-muted">
                    Sample active disputes with real Razorpay reason codes, status pills, and action hooks.
                  </CardDescription>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[4px] bg-rp-surface text-rp-slate border border-rp-border">
                UPI / Card Reason Codes
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-rp-bg-3 border-b border-rp-border">
                <TableRow className="border-rp-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-rp-slate uppercase tracking-wider pl-6 py-3">Dispute / ARN</TableHead>
                  <TableHead className="text-xs font-semibold text-rp-slate uppercase tracking-wider py-3">Payment ID</TableHead>
                  <TableHead className="text-xs font-semibold text-rp-slate uppercase tracking-wider py-3">Reason Code</TableHead>
                  <TableHead className="text-xs font-semibold text-rp-slate uppercase tracking-wider py-3">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-rp-slate uppercase tracking-wider py-3">Aegis Status</TableHead>
                  <TableHead className="text-xs font-semibold text-rp-slate uppercase tracking-wider pr-6 py-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Row 1: High Winnability / Safe */}
                <TableRow className="border-rp-border hover:bg-rp-bg-2 transition-colors cursor-pointer group">
                  <TableCell className="pl-6 py-3.5 font-sans font-medium text-rp-ink">
                    <div className="flex flex-col">
                      <span className="font-semibold text-rp-ink text-sm">disp_P1982XJa9</span>
                      <span className="text-[11px] text-rp-muted-2 font-mono">ARN: 902194829102</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-rp-slate font-mono py-3.5">pay_Nx81KlaP82</TableCell>
                  <TableCell className="text-xs text-rp-ink py-3.5">
                    <span className="font-medium text-rp-ink-2">
                      UPI_MERCH_NOT_DELIVERED
                    </span>
                    <div className="text-[11px] text-rp-muted">Proof of delivery on file</div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-rp-ink-black py-3.5">₹3,499.00</TableCell>
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-rp-green-tint text-rp-green border border-[#00A25133]">
                      <CheckCircle2 className="w-3 h-3" />
                      94% Winnable
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 py-3.5 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-rp-blue hover:bg-rp-blue-bg hover:text-rp-blue-hover text-xs font-medium rounded-[4px]">
                      Draft Rebuttal
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Row 2: Attention / Needs Proof */}
                <TableRow className="border-rp-border hover:bg-rp-bg-2 transition-colors cursor-pointer group">
                  <TableCell className="pl-6 py-3.5 font-sans font-medium text-rp-ink">
                    <div className="flex flex-col">
                      <span className="font-semibold text-rp-ink text-sm">disp_Q8102Bba4</span>
                      <span className="text-[11px] text-rp-muted-2 font-mono">ARN: 902194827711</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-rp-slate font-mono py-3.5">pay_Nx74MnoQ11</TableCell>
                  <TableCell className="text-xs text-rp-ink py-3.5">
                    <span className="font-medium text-rp-ink-2">
                      CARD_FRAUDULENT_TXN
                    </span>
                    <div className="text-[11px] text-rp-muted">3DS OTP Verified</div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-rp-ink-black py-3.5">₹12,800.00</TableCell>
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                      <AlertTriangle className="w-3 h-3" />
                      68% Review Needed
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 py-3.5 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-rp-blue hover:bg-rp-blue-bg hover:text-rp-blue-hover text-xs font-medium rounded-[4px]">
                      Add Evidence
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Row 3: Low Winnability / At Risk */}
                <TableRow className="border-rp-border hover:bg-rp-bg-2 transition-colors cursor-pointer group">
                  <TableCell className="pl-6 py-3.5 font-sans font-medium text-rp-ink">
                    <div className="flex flex-col">
                      <span className="font-semibold text-rp-ink text-sm">disp_R5501Zza1</span>
                      <span className="text-[11px] text-rp-muted-2 font-mono">ARN: 902194824409</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-rp-slate font-mono py-3.5">pay_Nx62LopZ99</TableCell>
                  <TableCell className="text-xs text-rp-ink py-3.5">
                    <span className="font-medium text-rp-ink-2">
                      UPI_DUPLICATE_DEBIT
                    </span>
                    <div className="text-[11px] text-rp-muted">Customer charged twice</div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-rp-ink-black py-3.5">₹1,999.00</TableCell>
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-rp-red-tint/35 text-rp-red border border-[#ED293933]">
                      <XCircle className="w-3 h-3" />
                      24% At Risk
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 py-3.5 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-rp-muted hover:bg-rp-bg-2 text-xs font-medium rounded-[4px]">
                      Accept Dispute
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardShell>
  );
}
