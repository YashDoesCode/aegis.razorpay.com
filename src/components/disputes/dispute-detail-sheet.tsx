"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  Truck,
  Send,
  Loader2,
  Copy,
  Check,
  Receipt,
  User,
  ShieldCheck,
  Scale,
  Clock,
} from "lucide-react";
import { WinnabilityResult } from "@/lib/scoring/types";
import { FraudSignalResult } from "@/lib/fraudSignal/types";
import { FraudSignalCard } from "./fraud-signal-card";
import { LocalErrorBoundary } from "@/components/ui/error-boundary";

export interface DisputeDetailItem {
  id: string;
  rzpDisputeId: string;
  orderId: string;
  paymentId: string;
  reasonCode: string;
  network: string;
  amount: number;
  currency: string;
  phase: string;
  status: string;
  dataSource?: "live" | "seed";
  data_source?: "live" | "seed";
  respondBy: string | Date;
  createdAt: string | Date;
  winnability: WinnabilityResult;
  fraudSignal?: FraudSignalResult;
  order?: {
    item?: string;
    amount?: number;
    rzpPaymentId?: string;
    customer?: {
      name: string;
      email?: string | null;
      address?: string | null;
      priorOrdersCount: number;
      priorDisputesCount: number;
    };
    delivery?: {
      courier?: string | null;
      trackingId?: string | null;
      deliveredAt?: string | Date | null;
      deliveredToAddress?: string | null;
      signatureCaptured?: boolean;
    } | null;
    communications?: {
      direction: string;
      channel: string;
      body: string;
      sentAt?: string | Date;
    }[];
    refunds?: {
      amount: number;
      status: string;
      rzpRefundId?: string | null;
    }[];
  };
  evidenceItems: {
    id?: string;
    type: string;
    present: boolean;
    documentRef?: string | null;
    note?: string | null;
  }[];
}

interface DisputeDetailSheetProps {
  dispute: DisputeDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisputeUpdated?: () => void;
}

export function DisputeDetailSheet({
  dispute,
  open,
  onOpenChange,
  onDisputeUpdated,
}: DisputeDetailSheetProps) {
  const [drafting, setDrafting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [draftResult, setDraftResult] = useState<{
    summary: string;
    explanationLetter: string;
    citedEvidence: string[];
    source?: "llm" | "fallback";
    razorpayContestResult?: unknown;
  } | null>(null);

  if (!dispute) return null;

  const { winnability } = dispute;
  const score = winnability?.score ?? 0;
  const band = winnability?.band ?? "low";

  const handleDraftAndContest = async () => {
    try {
      setDrafting(true);
      const res = await fetch(`/api/disputes/${encodeURIComponent(dispute.id)}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customInstructions: customPrompt }),
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || "Failed to generate rebuttal");
      }

      setDraftResult({
        summary: json.draftedRebuttal.summary,
        explanationLetter: json.draftedRebuttal.explanationLetter,
        citedEvidence: json.draftedRebuttal.citedEvidence,
        source: json.source || json.draftedRebuttal.source || "fallback",
        razorpayContestResult: json.razorpayContestResult,
      });

      const isSafeMode = (json.source || json.draftedRebuttal?.source) === "fallback";
      if (isSafeMode) {
        toast.info("Rebuttal generated in Safe Mode and staged in DRAFT mode on Razorpay.");
      } else {
        toast.success("Rebuttal drafted & staged on Razorpay contest in DRAFT mode!");
      }

      if (onDisputeUpdated) onDisputeUpdated();
    } catch (err: unknown) {
      console.error("Failed to draft rebuttal:", err);
      const e = err as Error;
      toast.error(e.message || "Failed to draft rebuttal");
    } finally {
      setDrafting(false);
    }
  };

  const handleSubmitContest = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/disputes/${encodeURIComponent(dispute.id)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: draftResult?.summary,
          customInstructions: customPrompt,
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || "Failed to submit contest");
      }

      toast.success("Dispute rebuttal submitted to Razorpay! Status transitioned to Under Review.");
      if (onDisputeUpdated) onDisputeUpdated();
    } catch (err: unknown) {
      console.error("Failed to submit contest:", err);
      const e = err as Error;
      toast.error(e.message || "Failed to submit contest");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptDispute = async () => {
    if (
      !confirm(
        "Are you sure you want to accept this dispute? This will forfeit the disputed amount."
      )
    ) {
      return;
    }

    try {
      setAccepting(true);
      const res = await fetch(`/api/disputes/${encodeURIComponent(dispute.id)}/accept`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to accept dispute");

      if (json.idempotent) {
        toast.info("Dispute was already accepted.");
      } else {
        toast.success("Dispute accepted and marked lost.");
      }

      if (onDisputeUpdated) onDisputeUpdated();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to accept dispute:", err);
      const e = err as Error;
      toast.error(e.message || "Failed to accept dispute");
    } finally {
      setAccepting(false);
    }
  };

  const copyToClipboard = (text: string, type: "summary" | "letter") => {
    try {
      navigator.clipboard.writeText(text);
      if (type === "summary") {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } else {
        setCopiedLetter(true);
        setTimeout(() => setCopiedLetter(false), 2000);
      }
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formattedAmount = `₹${((dispute.amount || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const respondDate = new Date(dispute.respondBy).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto custom-scrollbar p-0 bg-slate-50 border-l border-border-subtle z-50">
        <LocalErrorBoundary fallbackTitle="Dispute Details Drawer Encountered an Issue">
          <div className="sticky top-0 bg-white border-b border-border-subtle p-5 z-10 shadow-xs">
            <SheetHeader className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-ink text-base">
                    {dispute.id}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    {dispute.network.toUpperCase()} · Reason {dispute.reasonCode}
                  </span>
                  {(dispute.dataSource === "live" || (dispute as { data_source?: string }).data_source === "live") ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 font-medium border border-slate-200">
                      SANDBOX
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    dispute.status === "open"
                      ? "warning"
                      : dispute.status === "won"
                      ? "success"
                      : dispute.status === "lost"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {dispute.status.toUpperCase()}
                </Badge>
              </div>
              <SheetTitle className="text-lg font-bold text-ink mt-1 tracking-tight">
                Dispute Defense Dossier
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-slate flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Bank Representment Deadline: <strong>{respondDate}</strong></span>
                <span>·</span>
                <span className="font-mono">Ref: {dispute.rzpDisputeId || dispute.id}</span>
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable Investigation Body */}
          <div className="p-5 space-y-5">
            {/* Key Financial Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-[4px] border border-border-subtle shadow-xs">
                <div className="text-[10px] font-bold tracking-wider text-muted-slate uppercase">
                  Dispute Amount
                </div>
                <div className="font-mono text-base font-bold text-ink mt-0.5">
                  {formattedAmount}
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-[4px] border border-border-subtle shadow-xs">
                <div className="text-[10px] font-bold tracking-wider text-muted-slate uppercase">
                  Payment Rails
                </div>
                <div className="text-sm font-bold text-ink mt-0.5 uppercase">
                  {dispute.network}
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-[4px] border border-border-subtle shadow-xs">
                <div className="text-[10px] font-bold tracking-wider text-muted-slate uppercase">
                  Dispute Phase
                </div>
                <div className="text-sm font-semibold text-ink mt-0.5 capitalize">
                  {dispute.phase}
                </div>
              </div>
            </div>

            {/* 2. RECOMMENDED ACTION */}
            <div
              className={`p-4 rounded-[4px] border shadow-xs flex items-center justify-between gap-3 ${
                winnability.recommendation === "contest"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : winnability.recommendation === "gather_evidence"
                  ? "bg-amber-50/80 border-amber-200 text-amber-950"
                  : "bg-slate-100 border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-slate">
                    Aegis Action Recommendation
                  </div>
                  <div className="text-sm font-bold tracking-tight mt-0.5">
                    {winnability.recommendation === "contest"
                      ? "Contest Dispute (Strong Evidence Available)"
                      : winnability.recommendation === "gather_evidence"
                      ? "Gather Additional Evidence (Partial Coverage)"
                      : "Accept Dispute (Low Winnability / High Risk)"}
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[4px] bg-white border border-border-subtle shadow-xs shrink-0">
                {score}% WIN
              </span>
            </div>

            {/* 3. SCORE EXPLANATION */}
            <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Deterministic Winnability Breakdown
                  </h3>
                </div>
                {band === "high" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    High Winnability ({score}%)
                  </span>
                )}
                {band === "needs_evidence" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                    Needs Evidence ({score}%)
                  </span>
                )}
                {band === "low" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                    Low Winnability ({score}%)
                  </span>
                )}
              </div>

              {/* Score Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-slate font-medium">
                  <span>Evidence Completeness Score</span>
                  <span className="font-mono font-bold text-ink">{score} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      band === "high"
                        ? "bg-emerald-600"
                        : band === "needs_evidence"
                        ? "bg-amber-500"
                        : "bg-rose-600"
                    }`}
                    style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Scored Rule Checklist */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold tracking-wider text-muted-slate uppercase">
                  Rule Evaluation Telemetry
                </div>
                {winnability?.reasons?.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between text-xs py-1.5 px-2 rounded-[3px] bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      {r.met ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          r.met
                            ? "text-slate-900 font-semibold"
                            : "text-muted-slate line-through opacity-70"
                        }
                      >
                        {r.label}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold shrink-0 ml-2 ${
                        r.met ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      +{r.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. MISSING & VERIFIED EVIDENCE CHECKLIST */}
            <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Required Evidence Checklist
                  </h3>
                </div>
                <span className="text-xs font-semibold text-muted-slate">
                  {dispute.evidenceItems.filter((e) => e.present).length} of {dispute.evidenceItems.length} Verified
                </span>
              </div>

              <div className="space-y-2">
                {dispute.evidenceItems.map((item) => (
                  <div
                    key={item.type}
                    className="p-3 rounded-[4px] border border-border-subtle bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink capitalize">
                          {item.type.replace(/_/g, " ")}
                        </span>
                        {item.present ? (
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            VERIFIED PRESENT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300">
                            MISSING
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-muted-slate text-[11px]">{item.note}</p>
                      )}
                      {item.documentRef && (
                        <p className="font-mono text-[11px] text-primary">
                          Ref: {item.documentRef}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. FRAUD INDICATORS & 6. RELATIONSHIP GRAPH */}
            {dispute.fraudSignal && (
              <FraudSignalCard fraudSignal={dispute.fraudSignal} />
            )}

            {/* Order & Customer Metadata Context */}
            {dispute.order && (
              <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                  <Receipt className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Order & Transaction Context
                  </h3>
                </div>
                <div className="text-xs space-y-2 text-ink">
                  <div>
                    <span className="text-muted-slate">Order Item: </span>
                    <span className="font-semibold">{dispute.order.item}</span>
                  </div>
                  {dispute.order.customer && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-slate" />
                      <span>
                        {dispute.order.customer.name} (
                        {dispute.order.customer.priorOrdersCount} prior orders,{" "}
                        {dispute.order.customer.priorDisputesCount} prior disputes)
                      </span>
                    </div>
                  )}
                  {dispute.order.delivery && (
                    <div className="flex items-start gap-2 pt-1">
                      <Truck className="w-3.5 h-3.5 text-muted-slate mt-0.5" />
                      <div>
                        <span>
                          Courier: {dispute.order.delivery.courier} (AWB:{" "}
                          <span className="font-mono">{dispute.order.delivery.trackingId}</span>)
                        </span>
                        <p className="text-muted-slate text-[11px] mt-0.5">
                          Delivery Verification:{" "}
                          {dispute.order.delivery.signatureCaptured
                            ? "Customer OTP / Signature Verified"
                            : "Standard Courier Confirmation"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. REBUTTAL DRAFT & CONTEST STAGING */}
            <div className="bg-white p-5 rounded-[4px] border border-border-subtle shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Representment Rebuttal Engine
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  GROUNDED EVIDENCE ONLY
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">
                  Custom Merchant Notes (Optional, max 500 characters)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  placeholder="e.g. emphasize customer confirmed receipt via SMS OTP on delivery..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[4px] border border-border-subtle bg-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              {/* Render Drafted Rebuttal Results */}
              {draftResult && (
                <div className="space-y-4 pt-2">
                  {draftResult.source === "fallback" ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-[4px] text-xs text-amber-900 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold block">
                          Generated in Safe Mode (Deterministic Fallback)
                        </span>
                        <span className="text-[11px] text-amber-800 block">
                          Draft assembled reliably from verified present evidence and reason code rules.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px] text-xs text-blue-900 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold block">
                          Formal Representment Draft Assembled
                        </span>
                        <span className="text-[11px] text-blue-800 block">
                          Synthesized and strictly grounded in verified evidence documents.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3.5 rounded-[4px] space-y-2 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">
                        Razorpay Contest Summary (API Field &le; 1000 Chars)
                      </span>
                      <button
                        onClick={() => copyToClipboard(draftResult.summary, "summary")}
                        className="p-1 text-muted-slate hover:text-ink cursor-pointer"
                        title="Copy summary"
                      >
                        {copiedSummary ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-ink leading-relaxed">
                      {draftResult.summary}
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-[4px] space-y-2 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">
                        Full Formal Bank Explanation Letter
                      </span>
                      <button
                        onClick={() => copyToClipboard(draftResult.explanationLetter, "letter")}
                        className="p-1 text-muted-slate hover:text-ink cursor-pointer"
                        title="Copy letter"
                      >
                        {copiedLetter ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <pre className="text-xs text-ink/90 whitespace-pre-wrap font-sans leading-relaxed">
                      {draftResult.explanationLetter}
                    </pre>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-slate">Cited Evidence:</span>
                    {draftResult.citedEvidence.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-[4px] bg-primary/10 text-primary text-[11px] font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px] text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Staged on Razorpay API: <code>PATCH /v1/disputes/{dispute.rzpDisputeId || dispute.id}/contest</code> in <strong>draft</strong> mode.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-muted-slate text-center">
              Representments are staged in Draft mode on Razorpay API to allow merchant review before final settlement submission.
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-border-subtle p-4 z-10 shadow-xs flex flex-wrap items-center gap-2.5">
            {dispute.status === "under_review" ? (
              <div className="flex-1 flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 h-10 px-3 rounded-[4px] text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Contest Submitted & Under Review</span>
              </div>
            ) : draftResult ? (
              <>
                <Button
                  onClick={handleSubmitContest}
                  disabled={submitting || drafting || accepting}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-10 text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting to Razorpay...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Contest to Razorpay
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDraftAndContest}
                  disabled={drafting || submitting || accepting}
                  variant="outline"
                  className="text-xs font-semibold text-slate-700 border-border-subtle hover:bg-slate-50 h-10 rounded-[4px] cursor-pointer disabled:opacity-50"
                >
                  {drafting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Re-drafting...
                    </>
                  ) : (
                    "Re-Draft"
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleDraftAndContest}
                disabled={drafting || accepting}
                className="flex-1 bg-primary text-white hover:bg-primary-container h-10 text-xs font-semibold rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50"
              >
                {drafting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Drafting & Staging Contest (Draft)...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Draft & Stage Contest
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleAcceptDispute}
              disabled={accepting || drafting || submitting || dispute.status === "lost"}
              variant="outline"
              className="text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 h-10 rounded-[4px] cursor-pointer disabled:opacity-50"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Accepting...
                </>
              ) : dispute.status === "lost" ? (
                "Accepted (Closed)"
              ) : (
                "Accept Liability"
              )}
            </Button>
          </div>
        </LocalErrorBoundary>
      </SheetContent>
    </Sheet>
  );
}
