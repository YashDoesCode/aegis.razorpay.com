"use client";

import React, { useEffect, useRef } from "react";
import { StartupState } from "./types";

interface StartupOverlayProps {
  startupState: StartupState;
  onUserGesture: (e?: React.SyntheticEvent | Event) => void;
  onSkip?: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}

export function StartupOverlay({
  startupState,
  onUserGesture,
  onSkip,
  children,
  isDark = true,
}: StartupOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [startupState]);

  const handleSkipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSkip) {
      onSkip();
    } else {
      onUserGesture(e);
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Aegis Autonomous Defense Startup Sequence"
      tabIndex={0}
      onClick={onUserGesture}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          if (onSkip) onSkip();
          else onUserGesture(e);
        }
      }}
      className={`fixed inset-0 z-[99999] flex items-center justify-center select-none outline-none cursor-pointer ${
        isDark ? "bg-[#000000] text-white" : "bg-white text-slate-900"
      }`}
    >
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={handleSkipClick}
          aria-label="Skip intro sequence"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all duration-200 cursor-pointer shadow-sm ${
            isDark
              ? "bg-white/10 hover:bg-white/20 text-white/90 border-white/20 hover:border-white/40"
              : "bg-black/10 hover:bg-black/20 text-slate-800 border-black/10 hover:border-black/30"
          }`}
        >
          <span>Skip Intro</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 border border-white/20">
            Esc
          </kbd>
        </button>
      </div>

      <div
        className={`absolute inset-0 z-0 flex items-center justify-center overflow-hidden ${
          isDark ? "bg-[#000000]" : "bg-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
