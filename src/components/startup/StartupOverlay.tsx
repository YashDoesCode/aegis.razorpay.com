"use client";

import React, { useEffect, useRef } from "react";
import { StartupState } from "./types";
import { Shield, Volume2 } from "lucide-react";

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

      {/* Minimalist Operational HUD Overlay when Waiting for User Gesture */}
      {isWaitingForGesture && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white mb-6 shadow-sm">
              <Shield className="w-6 h-6" />
            </div>

            <h1 className="text-xl sm:text-2xl font-sans font-semibold tracking-tight text-white mb-3">
              Click anywhere to start Aegis
            </h1>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Volume2 className="w-4 h-4" />
              <span>Audio playback requires interaction</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
