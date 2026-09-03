"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useSyncExternalStore } from "react";
import { safeStorage, STORAGE_KEYS, ThemeMode } from "@/lib/storage/safeStorage";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const emptySubscribe = () => () => {};

function applyThemeToDocument(targetTheme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "theme-amoled");
  root.removeAttribute("data-theme");

  if (targetTheme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else if (targetTheme === "amoled") {
    root.classList.add("dark", "theme-amoled");
    root.setAttribute("data-theme", "amoled");
  } else {
    root.setAttribute("data-theme", "light");
  }
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

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    safeStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    applyThemeToDocument(newTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      isMounted,
    }),
    [theme, setTheme, isMounted]
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
