import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { safeStorage, STORAGE_KEYS } from "../safeStorage";

describe("SafeStorage", () => {
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

  it("gets and sets string items safely", () => {
    safeStorage.setItem(STORAGE_KEYS.THEME, "dark");
    expect(safeStorage.getItem(STORAGE_KEYS.THEME, "light")).toBe("dark");
  });

  it("gets and sets object items safely", () => {
    const state = { completed: true, skipped: false };
    safeStorage.setItem(STORAGE_KEYS.ONBOARDING, state);
    expect(
      safeStorage.getItem(STORAGE_KEYS.ONBOARDING, {
        completed: false,
        skipped: false,
      })
    ).toEqual(state);
  });

  it("returns fallback if item does not exist", () => {
    expect(safeStorage.getItem("non-existent", "fallback")).toBe("fallback");
  });

  it("removes items safely", () => {
    safeStorage.setItem(STORAGE_KEYS.LAST_TAB, "/disputes");
    safeStorage.removeItem(STORAGE_KEYS.LAST_TAB);
    expect(safeStorage.getItem(STORAGE_KEYS.LAST_TAB, "/overview")).toBe(
      "/overview"
    );
  });
});
