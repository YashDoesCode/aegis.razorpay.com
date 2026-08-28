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
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  Receipt,
  User,
  ShieldCheck,
  Info,
} from "lucide-react";
import { WinnabilityResult } from "@/lib/scoring/types";
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
  order?: {
    item?: string;
    amount?: number;
    rzpPaymentId?: string;
    customer?: {
      name: string;
      email?: string;
      address?: string;
      priorOrdersCount: number;
      priorDisputesCount: number;
    };
    delivery?: {
      courier: string;
      trackingId: string;
      deliveredAt?: string | Date | null;
      deliveredToAddress: string;
      signatureCaptured: boolean;
    } | null;
    communications?: {
      direction: string;
      channel: string;
      body: string;
      sentAt: string | Date;
    }[];
    refunds?: {
      amount: number;
      status: string;
      rzpRefundId?: string | null;
    }[];
  };
  evidenceItems: {
    id: string;
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
        toast.success("AI Rebuttal drafted & staged on Razorpay contest in DRAFT mode!");
      }

      if (onDisputeUpdated) onDisputeUpdated();
    } catch (err: unknown) {
      console.error("❌ Failed to draft rebuttal:", err);
      const e = err as Error;
      toast.error(e.message || "Failed to draft rebuttal");
    } finally {
      setDrafting(false);
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
      console.error("❌ Failed to accept dispute:", err);
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

  const formattedAmount = `₹${((dispute.amount || 0) / 100).toLocaleString("en-IN")}`;
  const respondDate = new Date(dispute.respondBy).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 bg-page-bg border-l border-border-subtle z-50">
        <LocalErrorBoundary fallbackTitle="Dispute Details Drawer Encountered an Issue">
          {/* Top Sticky Header */}
          <div className="sticky top-0 bg-white border-b border-border-subtle p-6 z-10 shadow-2xs">
            <SheetHeader className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-ink text-lg">
                    {dispute.id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-[4px] bg-rp-bg-2 text-muted-slate font-medium">
                    {dispute.network.toUpperCase()} · Code {dispute.reasonCode}
                  </span>
                  {(dispute.dataSource === "live" || (dispute as { data_source?: string }).data_source === "live") ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-slate-100 text-slate-600 font-medium border border-slate-200">
                      SEED
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
              <SheetTitle className="font-display text-xl font-semibold text-ink mt-1">
                Dispute Defense File
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-slate">
                Respond by {respondDate} · Razorpay Dispute Ref:{" "}
                {dispute.rzpDisputeId || dispute.id}
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable Body Content */}
          <div className="p-6 space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-[4px] border border-border-subtle flat-shadow">
                <div className="text-[11px] font-semibold tracking-wider text-muted-slate uppercase">
                  Dispute Amount
                </div>
                <div className="font-display text-lg font-semibold text-ink mt-0.5">
                  {formattedAmount}
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-[4px] border border-border-subtle flat-shadow">
                <div className="text-[11px] font-semibold tracking-wider text-muted-slate uppercase">
                  Payment Channel
                </div>
                <div className="font-display text-lg font-semibold text-ink mt-0.5">
                  {dispute.network.toUpperCase()}
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-[4px] border border-border-subtle flat-shadow">
                <div className="text-[11px] font-semibold tracking-wider text-muted-slate uppercase">
                  Phase
                </div>
                <div className="font-display text-lg font-semibold text-ink mt-0.5 capitalize">
                  {dispute.phase}
                </div>
              </div>
            </div>

            {/* Winnability Score Meter & Engine Assessment */}
            <div className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-ink text-base">
                    Aegis Winnability Engine
                  </h3>
                </div>
                {band === "high" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-success/10 text-success text-xs font-semibold">
                    High Winnability ({score}%)
                  </span>
                )}
                {band === "needs_evidence" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-attention/10 text-attention text-xs font-semibold">
                    Needs Evidence ({score}%)
                  </span>
                )}
                {band === "low" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-danger/10 text-danger text-xs font-semibold">
                    Low Winnability ({score}%)
                  </span>
                )}
              </div>

              {/* Score Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-slate font-medium">
                  <span>Deterministic Winnability Confidence</span>
                  <span className="font-semibold text-ink">{score}/100</span>
                </div>
                <div className="w-full h-2.5 bg-rp-bg-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      band === "high"
                        ? "bg-success"
                        : band === "needs_evidence"
                        ? "bg-attention"
                        : "bg-danger"
                    }`}
                    style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Scored Rule Checklist */}
              <div className="border-t border-border-subtle pt-3.5 space-y-2">
                <div className="text-xs font-semibold tracking-wider text-muted-slate uppercase mb-2">
                  Scoring Rule Breakdown
                </div>
                {winnability?.reasons?.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between text-xs py-1"
                  >
                    <div className="flex items-center gap-2">
                      {r.met ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-slate/50 shrink-0" />
                      )}
                      <span
                        className={
                          r.met
                            ? "text-ink font-medium"
                            : "text-muted-slate line-through opacity-70"
                        }
                      >
                        {r.label}
                      </span>
                    </div>
                    <span
                      className={`font-semibold shrink-0 ml-2 ${
                        r.met ? "text-success" : "text-muted-slate/50"
                      }`}
                    >
                      +{r.delta}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-rp-bg-2 p-3 rounded-[4px] text-xs text-muted-slate flex items-center justify-between">
                <span>Aegis Recommendation:</span>
                <span className="font-bold text-ink uppercase tracking-wide">
                  {winnability.recommendation === "contest"
                    ? "Contest Dispute (Strong Evidence)"
                    : winnability.recommendation === "gather_evidence"
                    ? "Gather Additional Evidence"
                    : "Accept Dispute (Low Winnability)"}
                </span>
              </div>
            </div>

            {/* Evidence Checklist */}
            <div className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-slate" />
                <h3 className="font-display font-semibold text-ink text-sm uppercase tracking-wider">
                  Required Evidence Checklist
                </h3>
              </div>
              <div className="space-y-2.5">
                {dispute.evidenceItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-[4px] border border-border-subtle bg-surface flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink capitalize">
                          {item.type.replace(/_/g, " ")}
                        </span>
                        {item.present ? (
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-success/10 text-success text-[10px] font-semibold">
                            VERIFIED PRESENT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-danger/10 text-danger text-[10px] font-semibold">
                            MISSING
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-muted-slate">{item.note}</p>
                      )}
                      {item.documentRef && (
                        <p className="font-mono text-[11px] text-primary">
                          {item.documentRef}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order & Customer Metadata */}
            {dispute.order && (
              <div className="bg-white p-5 rounded-[4px] border border-border-subtle flat-shadow space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted-slate" />
                  <h3 className="font-display font-semibold text-ink text-sm uppercase tracking-wider">
                    Order & Delivery Context
                  </h3>
                </div>
                <div className="text-xs space-y-2 text-ink">
                  <div>
                    <span className="text-muted-slate">Item: </span>
                    <span className="font-medium">{dispute.order.item}</span>
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
                          {dispute.order.delivery.trackingId})
                        </span>
                        <p className="text-muted-slate">
                          Signature / OTP:{" "}
                          {dispute.order.delivery.signatureCaptured
                            ? "Yes (Verified on file)"
                            : "None"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Rebuttal Drafting & Contest Panel */}
            <div className="bg-white p-5 rounded-[4px] border border-primary/30 flat-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-ink text-base">
                    Rebuttal Drafting Engine
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                  PROSE ONLY · GROUNDED
                </span>
              </div>

              <p className="text-xs text-muted-slate">
                Synthesizes verified delivery proofs, GST invoices, customer
                logs, and reason code rules into a formal representment letter.
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-ink">
                  Custom Merchant Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. emphasize customer signed delivery via BlueDart OTP..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[4px] border border-border-subtle bg-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  onClick={handleDraftAndContest}
                  disabled={drafting || accepting}
                  className="flex-1 bg-primary text-white hover:bg-primary-container h-10 text-xs font-semibold rounded-[4px] flat-shadow cursor-pointer disabled:opacity-50"
                >
                  {drafting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Drafting & Staging Contest (Draft)...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Draft & Contest (Draft Mode)
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleAcceptDispute}
                  disabled={accepting || drafting || dispute.status === "lost"}
                  variant="outline"
                  className="text-xs font-semibold text-danger border-danger/30 hover:bg-danger/5 h-10 rounded-[4px] cursor-pointer disabled:opacity-50"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Accepting...
                    </>
                  ) : dispute.status === "lost" ? (
                    "Accepted"
                  ) : (
                    "Accept Dispute"
                  )}
                </Button>
              </div>

              {/* Render Drafted Rebuttal Results */}
              {draftResult && (
                <div className="border-t border-border-subtle pt-4 space-y-4 animate-in fade-in duration-300">
                  {/* Safe mode vs AI badge */}
                  {draftResult.source === "fallback" ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-[4px] text-xs text-amber-900 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold block">
                          Generated in Safe Mode (Deterministic Fallback)
                        </span>
                        <span className="text-[11px] text-amber-800 block">
                          Draft assembled reliably from verified present evidence and reason code rules without external latency.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px] text-xs text-blue-900 flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold block">
                          AI-Powered Representment Rebuttal
                        </span>
                        <span className="text-[11px] text-blue-800 block">
                          Synthesized and grounded in verified present evidence documents.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-rp-bg-2 p-3.5 rounded-[4px] space-y-2 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">
                        Razorpay Contest Summary (API Field &le; 1000 Chars)
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(draftResult.summary, "summary")
                        }
                        className="p-1 text-muted-slate hover:text-ink cursor-pointer"
                        title="Copy summary"
                      >
                        {copiedSummary ? (
                          <Check className="w-3.5 h-3.5 text-success" />
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
                        Full Formal Explanation Letter
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            draftResult.explanationLetter,
                            "letter"
                          )
                        }
                        className="p-1 text-muted-slate hover:text-ink cursor-pointer"
                        title="Copy letter"
                      >
                        {copiedLetter ? (
                          <Check className="w-3.5 h-3.5 text-success" />
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
                      Staged on Razorpay API:{" "}
                      <code>PATCH /v1/disputes/{dispute.rzpDisputeId || dispute.id}/contest</code> in <strong>draft</strong> mode.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-muted-slate/70 text-center italic">
              Hackathon prototype — all representment filings execute in DRAFT mode on Razorpay API.
            </div>
          </div>
        </LocalErrorBoundary>
      </SheetContent>
    </Sheet>
  );
}
