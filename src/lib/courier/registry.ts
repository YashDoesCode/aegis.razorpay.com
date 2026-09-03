import { CourierAdapter } from "./types";
import { DelhiveryAdapter } from "./adapters/delhivery";
import { MockCourierAdapter } from "./adapters/mock";

const adapters = new Map<string, CourierAdapter>();

// Register default built-in adapters
adapters.set("delhivery", new DelhiveryAdapter());
adapters.set("mock", new MockCourierAdapter());

/**
 * Registers or overrides a 3PL logistics courier adapter.
 */
export function registerCourierAdapter(adapter: CourierAdapter): void {
  adapters.set(adapter.providerId.toLowerCase(), adapter);
}

/**
 * Resolves a registered CourierAdapter by its provider ID.
 * Defaults to DelhiveryAdapter if unprovided or unrecognized in production,
 * or MockCourierAdapter in test environment.
 */
export function getCourierAdapter(providerId?: string): CourierAdapter {
  const cleanId = (providerId || "").trim().toLowerCase();

  if (cleanId && adapters.has(cleanId)) {
    return adapters.get(cleanId)!;
  }

  // In test environment, default to mock
  if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") {
    return adapters.get("mock") || new MockCourierAdapter();
  }

  return adapters.get("delhivery") || new DelhiveryAdapter();
}

/**
 * Returns all registered 3PL provider identifiers.
 */
export function getRegisteredProviders(): string[] {
  return Array.from(adapters.keys());
}
