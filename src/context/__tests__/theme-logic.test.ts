import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { safeStorage, STORAGE_KEYS, ThemeMode, AccentMode } from "@/lib/storage/safeStorage";

describe("Theme, Accent, Sidebar, and Cache State Logic", () => {
  const memoryStore: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: (k: string) => memoryStore[k] ?? null,
        setItem: (k: string, v: string) => {
          memoryStore[k] = v;
        },
        removeItem: (k: string) => {
          delete memoryStore[k];
        },
        clear: () => {
          Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
        },
      },
    };
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("defaults to dark theme when uninitialized", () => {
    const initialTheme = safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "dark");
    expect(initialTheme).toBe("dark");
  });

  it("defaults to neutral (monochrome) accent when uninitialized", () => {
    const initialAccent = safeStorage.getItem<AccentMode>(STORAGE_KEYS.ACCENT, "neutral");
    expect(initialAccent).toBe("neutral");
  });

  it("persists dark theme selection across sessions", () => {
    safeStorage.setItem(STORAGE_KEYS.THEME, "dark");
    expect(safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "dark")).toBe("dark");
  });

  it("persists amoled theme selection across sessions", () => {
    safeStorage.setItem(STORAGE_KEYS.THEME, "amoled");
    expect(safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "dark")).toBe("amoled");
  });

  it("persists razorpay blue accent selection", () => {
    safeStorage.setItem(STORAGE_KEYS.ACCENT, "blue");
    expect(safeStorage.getItem<AccentMode>(STORAGE_KEYS.ACCENT, "neutral")).toBe("blue");
  });

  it("supports all six theme and accent combinations", () => {
    const themes: ThemeMode[] = ["light", "dark", "amoled"];
    const accents: AccentMode[] = ["neutral", "blue"];

    for (const theme of themes) {
      for (const accent of accents) {
        safeStorage.setItem(STORAGE_KEYS.THEME, theme);
        safeStorage.setItem(STORAGE_KEYS.ACCENT, accent);

        expect(safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "dark")).toBe(theme);
        expect(safeStorage.getItem<AccentMode>(STORAGE_KEYS.ACCENT, "neutral")).toBe(accent);
      }
    }
  });

  it("persists right sidebar collapsed state", () => {
    expect(safeStorage.getItem<boolean>(STORAGE_KEYS.RIGHT_SIDEBAR_COLLAPSED, false)).toBe(false);
    safeStorage.setItem(STORAGE_KEYS.RIGHT_SIDEBAR_COLLAPSED, true);
    expect(safeStorage.getItem<boolean>(STORAGE_KEYS.RIGHT_SIDEBAR_COLLAPSED, false)).toBe(true);
  });

  it("persists PWA dismissal state", () => {
    expect(safeStorage.getItem<boolean>(STORAGE_KEYS.PWA_DISMISSED, false)).toBe(false);
    safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
    expect(safeStorage.getItem<boolean>(STORAGE_KEYS.PWA_DISMISSED, false)).toBe(true);
  });

  it("clears local cache and resets display state when clearLocalData is called", () => {
    safeStorage.setItem(STORAGE_KEYS.THEME, "amoled");
    safeStorage.setItem(STORAGE_KEYS.ACCENT, "blue");
    safeStorage.setItem(STORAGE_KEYS.RIGHT_SIDEBAR_COLLAPSED, true);
    safeStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, true);
    safeStorage.setItem(STORAGE_KEYS.ONBOARDING, { completed: true, skipped: false });

    const result = safeStorage.clearLocalData();
    expect(result).toBe(true);

    expect(safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "dark")).toBe("dark");
    expect(safeStorage.getItem<AccentMode>(STORAGE_KEYS.ACCENT, "neutral")).toBe("neutral");
    expect(safeStorage.getItem<boolean>(STORAGE_KEYS.RIGHT_SIDEBAR_COLLAPSED, false)).toBe(false);
    expect(safeStorage.getItem<boolean>(STORAGE_KEYS.PWA_DISMISSED, false)).toBe(false);
  });
});
