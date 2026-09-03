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
    <div className="bg-white rounded-[4px] border border-border-subtle p-5 shadow-xs space-y-4">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-[4px] flex items-center justify-center font-bold text-xs ${
              isHigh
                ? "bg-rose-100 text-rose-700"
                : isMedium
                ? "bg-amber-100 text-amber-800"
                : isInsufficient
                ? "bg-slate-100 text-slate-600"
                : "bg-emerald-100 text-emerald-800"
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
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                First-Party & Friendly-Fraud Signal
              </h3>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[3px] ${
                  isHigh
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : isMedium
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : isInsufficient
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                {band === "high"
                  ? "High First-Party Risk"
                  : band === "medium"
                  ? "Medium Risk"
                  : band === "insufficient_signal"
                  ? "Insufficient Signal"
                  : "Clean Customer Profile"}
              </span>
            </div>
            <p className="text-[11px] text-muted-slate mt-0.5">
              Behavioral repeat-disputer telemetry computed strictly from verified customer order records
            </p>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[4px] shrink-0 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">
              Fraud Index
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                isHigh
                  ? "text-rose-600"
                  : isMedium
                  ? "text-amber-600"
                  : isInsufficient
                  ? "text-slate-500"
                  : "text-emerald-600"
              }`}
            >
              {score}%
            </span>
          </div>
        </div>
      </div>

      {/* Repeat Disputer Warning Callout */}
      {isRepeatDisputer && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-[4px] flex items-start gap-2.5 text-xs text-rose-900">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">
              Repeat Disputer Anomaly Detected
            </span>
            <span className="text-[11px] text-rose-800 leading-relaxed block">
              Customer profile exhibits historical chargebacks. Lifetime dispute-to-order ratio is{" "}
              <strong>{(disputeToOrderRatio * 100).toFixed(0)}%</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Contributing Factors Breakdown */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
          Contributing Evidence & Telemetry
        </div>
        <div className="space-y-1.5">
          {contributingFactors.map((factor) => (
            <div
              key={factor.id}
              className="flex items-start justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-800"
            >
              <div className="space-y-0.5 pr-2">
                <span className="font-semibold text-slate-900 block">{factor.label}</span>
                <span className="text-[11px] text-slate-600 block">{factor.evidence}</span>
              </div>
              <span
                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  factor.weight > 0
                    ? "bg-rose-100 text-rose-800"
                    : factor.weight < 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {factor.weight > 0 ? `+${factor.weight}` : factor.weight < 0 ? factor.weight : "0"} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Defense Strategy Impact */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-[4px] text-xs text-blue-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[#0D1A48]">
          <Scale className="w-3.5 h-3.5 text-primary" />
          <span>Contest Strategy Adjustment</span>
        </div>
        <p className="text-[11px] text-blue-900 leading-relaxed">
          {defenseImpact.explanation}
        </p>
      </div>

      {/* Relationship Graph Toggle & Canvas */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Network className="w-3.5 h-3.5 text-primary" />
            <span>Entity Relationship Graph ({relationshipGraph?.nodes?.length || 0} nodes)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGraph(!showGraph)}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
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
