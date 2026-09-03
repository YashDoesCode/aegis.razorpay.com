"use client";

import React, { useEffect, useRef } from "react";
import { StartupState } from "./types";
import { Shield, Terminal, Volume2 } from "lucide-react";

interface StartupOverlayProps {
  startupState: StartupState;
  onUserGesture: (e?: React.SyntheticEvent | Event) => void;
  children: React.ReactNode;
}

export function StartupOverlay({
  startupState,
  onUserGesture,
  children,
}: StartupOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Auto-focus the overlay for accessibility & immediate keyboard response
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [startupState]);

  const isWaitingForGesture = startupState === "WAITING_FOR_USER_GESTURE";
  const isFadingOut = startupState === "FADING_OUT";

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Aegis Autonomous Defense Startup Sequence"
      tabIndex={0}
      onClick={onUserGesture}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          onUserGesture(e);
        }
      }}
      className={`fixed inset-0 z-[99999] flex flex-col justify-between bg-[#030712] text-slate-200 select-none outline-none transition-all duration-300 ease-out ${
        isFadingOut ? "opacity-0 scale-[1.01] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        {children}
      </div>

      {/* Enterprise Terminal HUD Overlay when Waiting for User Gesture */}
      {isWaitingForGesture && (
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-10 pointer-events-auto bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-300">
          {/* Top Telemetry Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2">
                  <span>RAZORPAY AEGIS</span>
                  <span className="text-slate-500">{"//"}</span>
                  <span className="text-blue-400">SECURE OPERATING CONSOLE</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 tracking-tight">
                  SYSTEM INITIALIZATION SEQUENCE • V1.0.4
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>RUNTIME: READY</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>AUDIO ENGINE: ARMED</span>
              </div>
            </div>
          </div>

          {/* Central Bloomberg/Stripe Boot Prompt */}
          <div className="flex flex-col items-center justify-center text-center my-auto px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono mb-6 tracking-wide">
              <Terminal className="w-3.5 h-3.5" />
              <span>SECURE ACCESS GATEWAY</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold tracking-tight text-white mb-4">
              Click anywhere to start Aegis
            </h1>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono text-slate-400 tracking-wider">
              <span className="text-blue-400 font-bold">&gt;</span>
              <span>PRESS ANY KEY OR CLICK TO COMMENCE INITIALIZATION</span>
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
            </div>
          </div>

          {/* Bottom Diagnostics Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 pt-4 gap-2 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span>DISPUTE ORCHESTRATION: INITIALIZING</span>
              <span className="hidden md:inline text-slate-600">•</span>
              <span className="hidden md:inline">ENCRYPTION: AES-256-GCM</span>
            </div>
            <div className="text-slate-400">
              [ STANDBY MODE ]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
