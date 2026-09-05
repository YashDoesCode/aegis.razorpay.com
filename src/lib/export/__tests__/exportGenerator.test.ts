import { describe, it, expect } from "vitest";
import { generateExport } from "../generator";

describe("Canonical Export Generator", () => {
  it("generates CSV export with UTF-8 BOM and correct headers", async () => {
    const result = await generateExport("overview", "csv", "test");

    expect(result.mimeType).toBe("text/csv; charset=utf-8");
    expect(result.filename).toContain("razorpay-aegis-overview-test-");
    expect(result.filename).toContain(".csv");
    expect(typeof result.content).toBe("string");
    expect(result.content).toContain("\uFEFF");
    expect(result.content).toContain("Health Score");
    expect(result.content).toContain("Total Exposure");
  });

  it("generates JSON export with canonical structure", async () => {
    const result = await generateExport("disputes", "json", "test");

    expect(result.mimeType).toBe("application/json");
    expect(result.filename).toContain("razorpay-aegis-disputes-test-");
    expect(result.filename).toContain(".json");

    const parsed = JSON.parse(result.content as string);
    expect(parsed.reportType).toBe("disputes");
    expect(parsed.exportTimestamp).toBeDefined();
    expect(Array.isArray(parsed.disputes)).toBe(true);
  });

  it("generates PDF (HTML format) report with Razorpay Aegis branding", async () => {
    const result = await generateExport("overview", "pdf", "test");

    expect(result.mimeType).toBe("application/pdf");
    expect(result.filename).toContain(".pdf");
    expect(typeof result.content).toBe("string");
    expect(result.content).toContain("Razorpay Aegis");
    expect(result.content).toContain("Dispute Defense Operations Report");
  });

  it("generates DOCX format document", async () => {
    const result = await generateExport("case_package", "docx", "test");

    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(result.filename).toContain(".docx");
    expect(typeof result.content === "string" || Buffer.isBuffer(result.content)).toBe(true);
  });
});
