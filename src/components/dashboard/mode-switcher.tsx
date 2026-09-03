"use client";

import React from "react";
import { useMerchantMode } from "@/context/merchant-mode-context";

export function ModeSwitcher() {
  const { mode, setMode, merchant, setIsConnectModalOpen } = useMerchantMode();

  return (
    <div className="flex items-center gap-1 bg-[#09153A] border border-white/10 p-1 rounded-full shadow-xs">
      <button
        type="button"
        onClick={() => setMode("test")}
        className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase transition-all rounded-full cursor-pointer ${
          mode === "test"
            ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs"
            : "text-white/60 hover:text-white"
        }`}
        title="Test Mode (Demo Data & Sandbox Simulation)"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            mode === "test" ? "bg-amber-400 animate-pulse" : "bg-white/40"
          }`}
        />
        Test
      </button>

      <button
        type="button"
        onClick={() => {
          if (!merchant.isConnected) {
            setIsConnectModalOpen(true);
          } else {
            setMode("live");
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase transition-all rounded-full cursor-pointer ${
          mode === "live"
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs"
            : "text-white/60 hover:text-white"
        }`}
        title={
          merchant.isConnected
            ? `Live Mode (${merchant.merchantId})`
            : "Connect a Razorpay account to activate Live mode"
        }
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            mode === "live" ? "bg-emerald-400 animate-pulse" : "bg-white/40"
          }`}
        />
        Live
        {!merchant.isConnected && (
          <span className="text-[9px] bg-primary/30 text-blue-200 px-1.5 py-0.2 rounded-full border border-blue-400/30 ml-0.5 lowercase font-normal">
            connect
          </span>
        )}
      </button>
    </div>
  );
}
