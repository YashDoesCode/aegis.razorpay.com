"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useSyncExternalStore } from "react";
import { safeStorage, STORAGE_KEYS, ThemeMode, AccentMode } from "@/lib/storage/safeStorage";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accent: AccentMode;
  setAccent: (accent: AccentMode) => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const emptySubscribe = () => () => {};

function applyThemeAndAccentToDocument(targetTheme: ThemeMode, targetAccent: AccentMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "theme-amoled", "accent-neutral", "accent-blue");
  root.removeAttribute("data-theme");
  root.removeAttribute("data-accent");

  if (targetTheme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else if (targetTheme === "amoled") {
    root.classList.add("dark", "theme-amoled");
    root.setAttribute("data-theme", "amoled");
  } else {
    root.setAttribute("data-theme", "light");
  }

  root.classList.add(`accent-${targetAccent}`);
  root.setAttribute("data-accent", targetAccent);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "light");
  });

  const [accent, setAccentState] = useState<AccentMode>(() => {
    return safeStorage.getItem<AccentMode>(STORAGE_KEYS.ACCENT, "neutral");
  });

  useEffect(() => {
    applyThemeAndAccentToDocument(theme, accent);
  }, [theme, accent]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    safeStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    applyThemeAndAccentToDocument(newTheme, accent);
  }, [accent]);

  const setAccent = useCallback((newAccent: AccentMode) => {
    setAccentState(newAccent);
    safeStorage.setItem(STORAGE_KEYS.ACCENT, newAccent);
    applyThemeAndAccentToDocument(theme, newAccent);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      accent,
      setAccent,
      isMounted,
    }),
    [theme, setTheme, accent, setAccent, isMounted]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
