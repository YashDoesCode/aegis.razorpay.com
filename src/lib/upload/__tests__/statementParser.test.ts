import { describe, it, expect } from "vitest";
import {
  validateUploadFile,
  parseCSVContent,
  parseTextOrStructuredStatement,
  processStatementBuffer,
} from "../parser";

describe("Statement Parser & Upload Pipeline", () => {
  it("validates file size and extension correctly", () => {
    const validResult = validateUploadFile("statement_march.csv", 1024);
    expect(validResult.valid).toBe(true);

    const invalidExt = validateUploadFile("payload.exe", 1024);
    expect(invalidExt.valid).toBe(false);
    expect(invalidExt.error).toContain("Unsupported file format");

    const oversized = validateUploadFile("large.csv", 15 * 1024 * 1024);
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain("exceeds 10MB");
  });

  it("parses CSV statement correctly", () => {
    const csvContent = `payment_id,order_id,customer_name,customer_email,item,amount,status,date,courier,tracking_id
pay_test_001,order_test_001,Rohan Mehta,rohan@example.com,Noise Cancelling Headphones,4999,captured,2026-03-01,BlueDart,BD9928123
pay_test_002,order_test_002,Anita Sharma,anita@example.com,Smart Watch Pro,8999,disputed,2026-03-02,Delhivery,DELH448102`;

    const records = parseCSVContent(csvContent);

    expect(records.length).toBe(2);
    expect(records[0].paymentId).toBe("pay_test_001");
    expect(records[0].orderId).toBe("order_test_001");
    expect(records[0].amountPaise).toBe(499900);
    expect(records[0].customerName).toBe("Rohan Mehta");
    expect(records[0].courier).toBe("BlueDart");
    expect(records[1].status).toBe("disputed");
  });

  it("parses JSON statement correctly", () => {
    const jsonData = [
      {
        payment_id: "pay_json_001",
        order_id: "order_json_001",
        customer_name: "Vikram Malhotra",
        customer_email: "vikram@example.com",
        item: "Mechanical Keyboard",
        amount: 3499,
        status: "paid",
        date: "2026-03-03",
      },
    ];

    const records = parseTextOrStructuredStatement(JSON.stringify(jsonData), "statement.json");

    expect(records.length).toBe(1);
    expect(records[0].paymentId).toBe("pay_json_001");
    expect(records[0].amountPaise).toBe(3499);
    expect(records[0].customerName).toBe("Vikram Malhotra");
  });

  it("processes statement upload and creates normalized records in test mode", async () => {
    const csvContent = `payment_id,order_id,customer_name,customer_email,item,amount,status,date,courier,tracking_id
pay_upld_101,order_upld_101,Kavita Rao,kavita@example.com,Wireless Earbuds,2499,captured,2026-03-04,BlueDart,BD33990011`;

    const buffer = Buffer.from(csvContent, "utf-8");
    const result = await processStatementBuffer(buffer, "kavita_order.csv", "text/csv", "test");

    expect(result.status).toBe("processed");
    expect(result.recordsProcessed).toBe(1);
    expect(result.uploadId).toBeDefined();
    expect(result.contentHash).toBeDefined();
  });
});
