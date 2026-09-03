"use client";

import React, { useEffect, useRef } from "react";
import { StartupState } from "./types";

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

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [startupState]);

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
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-white text-slate-900 select-none outline-none transition-all duration-500 ease-out ${
        isFadingOut ? "opacity-0 scale-[1.01] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-white overflow-hidden">
        {children}
      </div>
    </div>
  );
}
