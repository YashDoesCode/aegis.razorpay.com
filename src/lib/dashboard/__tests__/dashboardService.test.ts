import { describe, it, expect } from "vitest";
import { computeDashboardOverview } from "../service";

describe("Dashboard Aggregation Service", () => {
  it("calculates real health score and exposure metrics for test mode", async () => {
    const overview = await computeDashboardOverview("test", "30D");

    expect(overview.mode).toBe("test");
    expect(overview.selectedRange).toBe("30D");
    expect(overview.healthScore).toBeGreaterThanOrEqual(0);
    expect(overview.healthScore).toBeLessThanOrEqual(100);
    expect(overview.totalExposurePaise).toBeGreaterThanOrEqual(0);
    expect(overview.totalExposureFormatted).toContain("₹");
    expect(overview.winnabilityDistribution).toBeDefined();
    expect(overview.winnabilityDistribution.strongPercent).toBeGreaterThanOrEqual(0);
    expect(overview.winnabilityDistribution.moderatePercent).toBeGreaterThanOrEqual(0);
    expect(overview.winnabilityDistribution.weakPercent).toBeGreaterThanOrEqual(0);
    expect(overview.timeSeries.length).toBeGreaterThan(0);
    expect(overview.recentAuditFeed.length).toBeGreaterThanOrEqual(0);
  });

  it("handles different time ranges cleanly without errors", async () => {
    const overview7D = await computeDashboardOverview("test", "7D");
    expect(overview7D.selectedRange).toBe("7D");
    expect(overview7D.timeSeries.length).toBeGreaterThan(0);

    const overviewAll = await computeDashboardOverview("test", "All");
    expect(overviewAll.selectedRange).toBe("All");
    expect(overviewAll.timeSeries.length).toBeGreaterThan(0);
  });

  it("returns zero states safely for live mode when no live disputes are connected", async () => {
    const overview = await computeDashboardOverview("live", "30D");

    expect(overview.mode).toBe("live");
    expect(overview.healthScore).toBeGreaterThanOrEqual(80);
    expect(overview.totalExposurePaise).toBe(0);
    expect(overview.openQueueCount).toBe(0);
    expect(overview.highRiskCount).toBe(0);
  });
});
