import { NextRequest } from "next/server";
import { processStatementBuffer } from "@/lib/upload/parser";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { extractTraceContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const trace = extractTraceContext(request);
  const { correlationId, requestId } = trace;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = (formData.get("mode") as string) || "test";

    if (!file || typeof file === "string") {
      return apiError("Missing statement file in form payload", 400, "MISSING_FILE");
    }

    const blob = file as Blob;
    const filename = (blob as File).name || "statement_upload.csv";
    const mimeType = blob.type || "application/octet-stream";
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.info("Processing custom statement document upload", {
      module: "ApiStatementUpload",
      correlationId,
      requestId,
      filename,
      fileSize: buffer.length,
      mode,
    });

    const result = await processStatementBuffer(buffer, filename, mimeType, mode as "test" | "live");

    if (result.status === "failed") {
      return apiError(result.errors.join("; ") || "Statement validation failed", 400, "VALIDATION_ERROR", result);
    }

    return apiSuccess(result, 200, {
      correlationId,
      uploadId: result.uploadId,
    });
  } catch (error: unknown) {
    logger.error("Failed to process statement upload", error, {
      module: "ApiStatementUpload",
      correlationId,
      requestId,
    });
    return apiError("Internal server error parsing statement document", 500, "INTERNAL_ERROR");
  }
}
