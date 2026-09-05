export const STORAGE_KEYS = {
  THEME: "aegis:theme:v1",
  ACCENT: "aegis:accent:v1",
  STARTUP_TIMESTAMP: "aegis:startup:timestamp:v1",
  ONBOARDING: "aegis:onboarding:v1",
  LAST_TAB: "aegis:nav:last_tab:v1",
  NAV_COLLAPSED: "aegis:nav:collapsed:v1",
  RIGHT_SIDEBAR_COLLAPSED: "aegis:sidebar:collapsed:v1",
  PWA_DISMISSED: "aegis:pwa:dismissed:v1",
  REDUCED_MOTION: "aegis:motion:reduced:v1",
} as const;

export interface OnboardingState {
  completed: boolean;
  skipped: boolean;
  step?: number;
}

export type ThemeMode = "light" | "dark" | "amoled";
export type AccentMode = "neutral" | "blue";

class SafeStorage {
  private isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const testKey = "__aegis_storage_test__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem<T>(key: string, fallback: T): T {
    if (!this.isAvailable()) return fallback;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch {
      return fallback;
    }
  }

  setItem<T>(key: string, value: T): void {
    if (!this.isAvailable()) return;
    try {
      if (typeof value === "string") {
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {}
  }

  removeItem(key: string): void {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }

  clearLocalData(): boolean {
    if (!this.isAvailable()) return false;
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const k of keys) {
        window.localStorage.removeItem(k);
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const safeStorage = new SafeStorage();
