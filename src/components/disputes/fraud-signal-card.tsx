"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Network,
  ChevronDown,
  ChevronUp,
  Scale,
} from "lucide-react";
import { FraudSignalResult } from "@/lib/fraudSignal/types";
import { RelationshipGraph } from "./relationship-graph";

interface FraudSignalCardProps {
  fraudSignal?: FraudSignalResult;
}

export function FraudSignalCard({ fraudSignal }: FraudSignalCardProps) {
  const [showGraph, setShowGraph] = useState(true);

  if (!fraudSignal) return null;

  const {
    score,
    band,
    isRepeatDisputer,
    disputeToOrderRatio,
    contributingFactors,
    defenseImpact,
    relationshipGraph,
  } = fraudSignal;

  const isHigh = band === "high";
  const isMedium = band === "medium";
  const isInsufficient = band === "insufficient_signal";

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-medium text-xs ${
              isHigh
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : isMedium
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : isInsufficient
                ? "bg-muted text-muted-foreground"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isHigh ? (
              <ShieldAlert className="w-4 h-4" />
            ) : isMedium ? (
              <AlertTriangle className="w-4 h-4" />
            ) : isInsufficient ? (
              <Info className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                First-Party &amp; Friendly-Fraud Signal
              </h3>
              <span
                className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border ${
                  isHigh
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : isMedium
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : isInsufficient
                    ? "bg-muted text-muted-foreground border-border"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                }`}
              >
                {band === "high"
                  ? "High Risk"
                  : band === "medium"
                  ? "Medium Risk"
                  : band === "insufficient_signal"
                  ? "Insufficient Signal"
                  : "Clean Profile"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Behavioral repeat-disputer telemetry computed from verified customer order records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 border border-border px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-medium text-muted-foreground block leading-tight">
              Fraud Index
            </span>
            <span
              className={`text-xs font-semibold font-mono ${
                isHigh
                  ? "text-rose-600 dark:text-rose-400"
                  : isMedium
                  ? "text-amber-600 dark:text-amber-400"
                  : isInsufficient
                  ? "text-muted-foreground"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {score}%
            </span>
          </div>
        </div>
      </div>

      {isRepeatDisputer && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-medium block">
              Repeat Disputer Anomaly Detected
            </span>
            <span className="text-[11px] opacity-90 leading-relaxed block">
              Customer profile exhibits historical chargebacks. Lifetime dispute-to-order ratio is{" "}
              <strong className="font-semibold">{(disputeToOrderRatio * 100).toFixed(0)}%</strong>.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">
          Contributing Evidence &amp; Telemetry
        </div>
        <div className="space-y-1.5">
          {contributingFactors.map((factor) => (
            <div
              key={factor.id}
              className="flex items-start justify-between p-2.5 bg-muted/30 border border-border rounded-lg text-xs"
            >
              <div className="space-y-0.5 pr-2">
                <span className="font-medium text-foreground block">{factor.label}</span>
                <span className="text-[11px] text-muted-foreground block">{factor.evidence}</span>
              </div>
              <span
                className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                  factor.weight > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : factor.weight < 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {factor.weight > 0 ? `+${factor.weight}` : factor.weight < 0 ? factor.weight : "0"} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Scale className="w-3.5 h-3.5 text-primary" />
          <span>Contest Strategy Adjustment</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {defenseImpact.explanation}
        </p>
      </div>

      <div className="pt-2 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Network className="w-3.5 h-3.5 text-primary" />
            <span>Entity Relationship Graph ({relationshipGraph?.nodes?.length || 0} nodes)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGraph(!showGraph)}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
          >
            <span>{showGraph ? "Hide Graph" : "Inspect Graph"}</span>
            {showGraph ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showGraph && relationshipGraph && (
          <RelationshipGraph
            nodes={relationshipGraph.nodes}
            edges={relationshipGraph.edges}
            height={320}
          />
        )}
      </div>
    </div>
  );
}
