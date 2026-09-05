import { NextRequest } from "next/server";
import { computeDashboardOverview, TimeRangeOption } from "@/lib/dashboard/service";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { extractTraceContext } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DashboardQuerySchema = z.object({
  mode: z.enum(["test", "live"]).default("test"),
  range: z.enum(["7D", "30D", "90D", "6M", "1Y", "All"]).default("30D"),
});

export async function GET(request: NextRequest) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId } = trace;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = DashboardQuerySchema.safeParse({
      mode: searchParams.get("mode") || "test",
      range: searchParams.get("range") || "30D",
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, "INVALID_QUERY");
    }

    const { mode, range } = parsed.data;

    logger.info("Computing dashboard overview metrics", {
      module: "ApiDashboard",
      correlationId,
      requestId,
      mode,
      range,
    });

    const overview = await computeDashboardOverview(mode, range as TimeRangeOption);
    return apiSuccess(overview, 200, {
      mode,
      range,
      correlationId,
    });
  } catch (error: unknown) {
    logger.error("Failed to compute dashboard overview", error, {
      module: "ApiDashboard",
      correlationId,
      requestId,
    });
    return apiError("Internal server error aggregating metrics", 500, "INTERNAL_ERROR");
  }
}
