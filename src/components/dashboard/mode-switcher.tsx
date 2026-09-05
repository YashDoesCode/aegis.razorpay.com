"use client";

import React from "react";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { Zap, ShieldCheck } from "lucide-react";

export function ModeSwitcher() {
  const { mode, setMode, merchant, setIsConnectModalOpen } = useMerchantMode();

  return (
    <div
      role="radiogroup"
      aria-label="Environment Mode Switcher"
      className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 p-1 rounded-full shadow-xs shrink-0"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "test"}
        onClick={() => setMode("test")}
        className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-wider uppercase transition-all duration-150 rounded-full cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-hidden ${
          mode === "test"
            ? "bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/50 shadow-xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
        title="Test Mode — Populated with deterministic demo disputes, evidence packs, and fraud signals"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            mode === "test"
              ? "bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              : "bg-slate-300 dark:bg-slate-600"
          }`}
        />
        <Zap className="w-3 h-3" />
        <span>Test (Demo)</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mode === "live"}
        onClick={() => {
          if (!merchant.isConnected) {
            setIsConnectModalOpen(true);
          } else {
            setMode("live");
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-wider uppercase transition-all duration-150 rounded-full cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
          mode === "live"
            ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-400/50 shadow-xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
        title={
          merchant.isConnected
            ? `Live Mode — Querying live disputes for merchant account (${merchant.merchantId})`
            : "Live Mode — Connect your Razorpay merchant account to manage live disputes"
        }
      >
        <span
          className={`w-2 h-2 rounded-full ${
            mode === "live"
              ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              : "bg-slate-300 dark:bg-slate-600"
          }`}
        />
        <ShieldCheck className="w-3 h-3" />
        <span>Live</span>
        {!merchant.isConnected && (
          <span className="text-[9px] bg-primary/15 text-primary dark:text-blue-300 px-1.5 py-0.2 rounded-full border border-primary/30 font-medium normal-case tracking-normal">
            connect
          </span>
        )}
      </button>
    </div>
  );
}
