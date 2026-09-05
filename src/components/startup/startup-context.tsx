"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { StartupState, StartupContextValue } from "./types";
import { safeStorage, STORAGE_KEYS } from "@/lib/storage/safeStorage";

const TEN_MINUTES_MS = 10 * 60 * 1000;

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function checkIsStartupSuppressed(): boolean {
  if (typeof window === "undefined") return false;
  const lastPlayed = safeStorage.getItem<number>(STORAGE_KEYS.STARTUP_TIMESTAMP, 0);
  if (!lastPlayed || typeof lastPlayed !== "number") return false;
  return Date.now() - lastPlayed < TEN_MINUTES_MS;
}

const StartupContext = createContext<StartupContextValue | undefined>(undefined);

export function StartupProvider({ children }: { children: React.ReactNode }) {
  const isSuppressed = useSyncExternalStore(
    subscribeToStorage,
    checkIsStartupSuppressed,
    () => false
  );

  const [startupState, setStartupState] = useState<StartupState>("IDLE");
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const markComplete = useCallback(() => {
    setStartupState("COMPLETE");
    setHasCompleted(true);
    safeStorage.setItem(STORAGE_KEYS.STARTUP_TIMESTAMP, Date.now());
  }, []);

  const triggerUserStart = useCallback(() => {
    setAudioUnlocked(true);
  }, []);

  const effectiveState: StartupState = isSuppressed && startupState === "IDLE" ? "COMPLETE" : startupState;
  const effectiveHasCompleted = hasCompleted || isSuppressed;

  const value = useMemo<StartupContextValue>(
    () => ({
      startupState: effectiveState,
      hasCompleted: effectiveHasCompleted,
      audioUnlocked,
      error,
      setError,
      setStartupState: (state: StartupState) => {
        setStartupState(state);
        if (state === "COMPLETE") {
          setHasCompleted(true);
          safeStorage.setItem(STORAGE_KEYS.STARTUP_TIMESTAMP, Date.now());
        }
      },
      markComplete,
      triggerUserStart,
    }),
    [effectiveState, effectiveHasCompleted, audioUnlocked, error, markComplete, triggerUserStart]
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
