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
});
