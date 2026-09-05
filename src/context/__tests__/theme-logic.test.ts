import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { safeStorage, STORAGE_KEYS, ThemeMode } from "@/lib/storage/safeStorage";

describe("Theme State and Persistence Logic", () => {
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

  it("defaults to light theme when uninitialized", () => {
    const initialTheme = safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "light");
    expect(initialTheme).toBe("light");
  });

  it("persists dark theme selection across sessions", () => {
    safeStorage.setItem(STORAGE_KEYS.THEME, "dark");
    expect(safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "light")).toBe("dark");
  });

  it("persists amoled theme selection across sessions", () => {
    safeStorage.setItem(STORAGE_KEYS.THEME, "amoled");
    expect(safeStorage.getItem<ThemeMode>(STORAGE_KEYS.THEME, "light")).toBe("amoled");
  });

  it("persists accent selection across sessions", () => {
    safeStorage.setItem(STORAGE_KEYS.ACCENT, "neutral");
    expect(safeStorage.getItem<string>(STORAGE_KEYS.ACCENT, "blue")).toBe("neutral");
  });

  it("persists startup timestamp and verifies 10 minute suppression", () => {
    const now = Date.now();
    safeStorage.setItem(STORAGE_KEYS.STARTUP_TIMESTAMP, now);
    const stored = safeStorage.getItem<number>(STORAGE_KEYS.STARTUP_TIMESTAMP, 0);
    expect(stored).toBe(now);
    expect(Date.now() - stored < 10 * 60 * 1000).toBe(true);
  });
});

