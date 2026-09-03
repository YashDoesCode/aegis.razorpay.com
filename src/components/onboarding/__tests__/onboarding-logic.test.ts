import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { safeStorage, STORAGE_KEYS, OnboardingState } from "@/lib/storage/safeStorage";
import { TOUR_STEPS } from "../onboarding-context";

describe("Onboarding and Tour State Machine", () => {
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

  it("defines comprehensive 6-step contextual tour steps", () => {
    expect(TOUR_STEPS.length).toBe(6);
    expect(TOUR_STEPS[0].targetId).toBe("tour-overview-header");
    expect(TOUR_STEPS[1].targetId).toBe("tour-hero-metrics");
    expect(TOUR_STEPS[2].targetId).toBe("tour-exposure-chart");
    expect(TOUR_STEPS[3].targetId).toBe("tour-action-queue");
    expect(TOUR_STEPS[4].targetId).toBe("tour-winnability-risk");
    expect(TOUR_STEPS[5].targetId).toBe("tour-merchant-menu");
  });

  it("initializes onboarding as incomplete for first-time users", () => {
    const state = safeStorage.getItem<OnboardingState>(STORAGE_KEYS.ONBOARDING, {
      completed: false,
      skipped: false,
    });
    expect(state.completed).toBe(false);
    expect(state.skipped).toBe(false);
  });

  it("persists completed state once tour finishes", () => {
    safeStorage.setItem(STORAGE_KEYS.ONBOARDING, {
      completed: true,
      skipped: false,
    });
    const state = safeStorage.getItem<OnboardingState>(STORAGE_KEYS.ONBOARDING, {
      completed: false,
      skipped: false,
    });
    expect(state.completed).toBe(true);
    expect(state.skipped).toBe(false);
  });

  it("persists skipped state when user dismisses tour", () => {
    safeStorage.setItem(STORAGE_KEYS.ONBOARDING, {
      completed: false,
      skipped: true,
    });
    const state = safeStorage.getItem<OnboardingState>(STORAGE_KEYS.ONBOARDING, {
      completed: false,
      skipped: false,
    });
    expect(state.completed).toBe(false);
    expect(state.skipped).toBe(true);
  });
});
