"use client";

import React from "react";
import { useMerchantMode } from "@/context/merchant-mode-context";

export function ModeSwitcher() {
  const { mode, setMode, merchant, setIsConnectModalOpen } = useMerchantMode();

  return (
    <div className="flex items-center gap-1 bg-[#09153a] border border-[#1e293b] p-0.5 rounded-[4px]">
      {/* Test Option */}
      <button
        type="button"
        onClick={() => setMode("test")}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase transition-all rounded-[3px] ${
          mode === "test"
            ? "bg-[#1e293b] text-amber-300 shadow-sm border border-amber-500/30"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Test Mode (Demo Data & Sandbox Simulation)"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            mode === "test" ? "bg-amber-400 animate-pulse" : "bg-slate-600"
          }`}
        />
        Test
      </button>

      {/* Live Option */}
      <button
        type="button"
        onClick={() => {
          if (!merchant.isConnected) {
            setIsConnectModalOpen(true);
          } else {
            setMode("live");
          }
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase transition-all rounded-[3px] ${
          mode === "live"
            ? "bg-[#052e16] text-emerald-300 shadow-sm border border-emerald-500/40"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title={
          merchant.isConnected
            ? `Live Mode (${merchant.merchantId})`
            : "Connect a Razorpay account to activate Live mode"
        }
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            mode === "live" ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
          }`}
        />
        Live
        {!merchant.isConnected && (
          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded border border-blue-400/30 ml-0.5 lowercase font-normal">
            connect
          </span>
        )}
      </button>
    </div>
  );
}
