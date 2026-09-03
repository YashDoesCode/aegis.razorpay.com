"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { StartupState, StartupContextValue } from "./types";

const StartupContext = createContext<StartupContextValue | undefined>(undefined);

export function StartupProvider({ children }: { children: React.ReactNode }) {
  const [startupState, setStartupState] = useState<StartupState>("IDLE");
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const markComplete = useCallback(() => {
    setStartupState("COMPLETE");
    setHasCompleted(true);
  }, []);

  const triggerUserStart = useCallback(() => {
    setAudioUnlocked(true);
  }, []);

  const value = useMemo<StartupContextValue>(
    () => ({
      startupState,
      hasCompleted,
      audioUnlocked,
      error,
      setError,
      setStartupState: (state: StartupState) => {
        setStartupState(state);
        if (state === "COMPLETE") {
          setHasCompleted(true);
        }
      },
      markComplete,
      triggerUserStart,
    }),
    [startupState, hasCompleted, audioUnlocked, error, markComplete, triggerUserStart]
  );

  return <StartupContext.Provider value={value}>{children}</StartupContext.Provider>;
}

export function useStartupContext(): StartupContextValue {
  const context = useContext(StartupContext);
  if (!context) {
    throw new Error("useStartupContext must be used within a StartupProvider");
  }
  return context;
}
