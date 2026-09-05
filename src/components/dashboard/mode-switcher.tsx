"use client";

import React from "react";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ModeSwitcher() {
  const { mode, setMode, merchant, setIsConnectModalOpen } = useMerchantMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Environment Selector: Currently ${mode === "live" ? "Live" : "Test Sandbox"}`}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer shadow-xs focus-visible:ring-1 focus-visible:ring-foreground focus-visible:outline-hidden",
            mode === "live"
              ? "bg-card text-foreground border-border hover:bg-muted"
              : "bg-muted/50 text-foreground border-border hover:bg-muted"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              mode === "live"
                ? merchant.isConnected
                  ? "bg-emerald-600 dark:bg-emerald-400"
                  : "bg-blue-600 dark:bg-blue-400"
                : "bg-amber-600 dark:bg-amber-400"
            )}
          />
          <span className="font-medium">
            {mode === "live" ? "Live" : "Demo"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground stroke-[2]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 p-1.5 space-y-1 rounded-xl shadow-lg border border-border bg-card text-xs"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Environment
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={() => setMode("test")}
          className={cn(
            "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted transition",
            mode === "test" && "bg-muted/70 font-medium"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            <div>
              <div className="text-xs text-foreground font-medium">Test (Demo)</div>
              <div className="text-[10px] text-muted-foreground">Deterministic simulated disputes</div>
            </div>
          </div>
          {mode === "test" && <Check className="w-3.5 h-3.5 text-foreground stroke-[2]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            if (!merchant.isConnected) {
              setIsConnectModalOpen(true);
            } else {
              setMode("live");
            }
          }}
          className={cn(
            "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted transition",
            mode === "live" && "bg-muted/70 font-medium"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <div>
              <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <span>Live Mode</span>
                {!merchant.isConnected && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground border border-border font-normal">
                    Requires API key
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">Real merchant webhook synchronization</div>
            </div>
          </div>
          {mode === "live" && <Check className="w-3.5 h-3.5 text-foreground stroke-[2]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
