"use client";

import React, { useEffect, useRef } from "react";
import { StartupState } from "./types";

interface StartupOverlayProps {
  startupState: StartupState;
  onUserGesture: (e?: React.SyntheticEvent | Event) => void;
  children: React.ReactNode;
  isDark?: boolean;
}

export function StartupOverlay({
  startupState,
  onUserGesture,
  children,
  isDark = true,
}: StartupOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [startupState]);

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
      className={`fixed inset-0 z-[99999] flex items-center justify-center select-none outline-none ${
        isDark ? "bg-[#000000] text-white" : "bg-white text-slate-900"
      }`}
    >
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
