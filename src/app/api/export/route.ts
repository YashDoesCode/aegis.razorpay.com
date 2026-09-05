import { NextRequest, NextResponse } from "next/server";
import { generateExport, ExportType, ExportFormat } from "@/lib/export/generator";
import { apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { extractTraceContext } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ExportQuerySchema = z.object({
  type: z.enum(["overview", "disputes", "transactions", "settlements", "fraud", "case_package"]).default("overview"),
  format: z.enum(["json", "csv", "pdf", "docx"]).default("csv"),
  mode: z.enum(["test", "live"]).default("test"),
});

export async function GET(request: NextRequest) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId } = trace;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = ExportQuerySchema.safeParse({
      type: searchParams.get("type") || "overview",
      format: searchParams.get("format") || "csv",
      mode: searchParams.get("mode") || "test",
    });

    if (!parsed.success) {
      return apiError("Invalid export parameters", 400, "INVALID_EXPORT_QUERY");
    }

    const { type, format, mode } = parsed.data;

    logger.info("Generating canonical report export", {
      module: "ApiExport",
      correlationId,
      requestId,
      type,
      format,
      mode,
    });

    const result = await generateExport(type as ExportType, format as ExportFormat, mode as "test" | "live");

    const body = typeof result.content === "string" ? result.content : new Uint8Array(result.content);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Correlation-Id": correlationId,
        "X-Request-Id": requestId,
      },
    });
  } catch (error: unknown) {
    logger.error("Failed to generate export", error, {
      module: "ApiExport",
      correlationId,
      requestId,
    });
    return apiError("Internal server error generating export", 500, "EXPORT_ERROR");
  }
}
