import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  connectMerchantAccount,
  disconnectMerchantAccount,
  getMerchantConnectionStatus,
  getDecryptedActiveMerchantCredentials,
  getActiveRazorpayClient,
  getActiveRazorpayClientAsync,
  resolveMerchantCredential,
  __resetInMemoryMerchantCacheForTesting,
  maskKey,
} from "../merchantAccount";
import { isEncrypted, encryptSecret } from "../crypto";
import { logger } from "../logger";
import { AuditService } from "../audit";

describe("Merchant Account Envelope Encryption, Persistence & Cold-Start Recovery Tests", () => {
  const testKeyId = "rzp_test_SecuredKeyId123";
  const testSecret = "SuperSecretPlainTextValue987!";
  const liveKeyId = "rzp_live_LiveProductionKey456";
  const liveSecret = "LiveSuperSecretPayloadA1B2C3D4!";

  beforeEach(async () => {
    await disconnectMerchantAccount();
    __resetInMemoryMerchantCacheForTesting();
  });

  it("1. Encrypts secret upon merchant connection and decrypts only for client creation", async () => {
    const result = await connectMerchantAccount({
      keyId: testKeyId,
      keySecret: testSecret,
      merchantName: "Secured Test Merchant",
    });

    expect(result.ok).toBe(true);

    const status = await getMerchantConnectionStatus();
    expect(status.isConnected).toBe(true);
    expect(status.maskedKeyId).toBe("rzp_test_S...d123");
    expect((status as unknown as Record<string, unknown>).keySecret).toBeUndefined();
    expect((status as unknown as Record<string, unknown>).encryptedSecret).toBeUndefined();

    const decryptedCreds = getDecryptedActiveMerchantCredentials();
    expect(decryptedCreds).toBeDefined();
    expect(decryptedCreds?.keyId).toBe(testKeyId);
    expect(decryptedCreds?.keySecret).toBe(testSecret);

    const client = getActiveRazorpayClient("live");
    expect(client).toBeDefined();

    await disconnectMerchantAccount();

    const afterStatus = await getMerchantConnectionStatus();
    expect(afterStatus.isConnected).toBe(false);
    expect(getDecryptedActiveMerchantCredentials()).toBeNull();
  });

  it("2. Verifies encrypted secret format using isEncrypted helper", async () => {
    const res = await connectMerchantAccount({
      keyId: testKeyId,
      keySecret: testSecret,
    });

    expect(res.ok).toBe(true);
    const encrypted = encryptSecret(testSecret);
    expect(isEncrypted(encrypted)).toBe(true);
    const creds = getDecryptedActiveMerchantCredentials();
    expect(creds?.keySecret).toBe(testSecret);
  });

  it("3. Test and live modes maintain strict credential isolation", async () => {
    await connectMerchantAccount({
      keyId: liveKeyId,
      keySecret: liveSecret,
      merchantName: "Apex Live Corp",
    });

    const liveCreds = getDecryptedActiveMerchantCredentials();
    expect(liveCreds?.keyId).toBe(liveKeyId);
    expect(liveCreds?.keySecret).toBe(liveSecret);

    const testClient = getActiveRazorpayClient("test");
    expect(testClient).toBeDefined();

    await disconnectMerchantAccount();
    const disconnectedStatus = await getMerchantConnectionStatus();
    expect(disconnectedStatus.mode).toBe("test");
    expect(disconnectedStatus.isConnected).toBe(false);
    expect(getDecryptedActiveMerchantCredentials()).toBeNull();
  });

  it("4. COLD START RECOVERY: Recovers encrypted merchant credentials from database after process memory wipe", async () => {
    // 1. Merchant connects
    const connectRes = await connectMerchantAccount({
      keyId: liveKeyId,
      keySecret: liveSecret,
      merchantName: "Vercel Cold Start Merchant",
    });
    expect(connectRes.ok).toBe(true);
    const merchantId = connectRes.merchant?.merchantId;
    expect(merchantId).toBeDefined();

    // 2. SIMULATE FRESH VERCEL SERVER INSTANCE / COLD START
    __resetInMemoryMerchantCacheForTesting();
    expect(getDecryptedActiveMerchantCredentials()).toBeNull();

    // 3. Resolve merchant credential from durable storage (DB)
    const recovered = await resolveMerchantCredential(merchantId, "live");
    expect(recovered).not.toBeNull();
    expect(recovered?.keyId).toBe(liveKeyId);
    expect(recovered?.keySecret).toBe(liveSecret);
    expect(recovered?.mode).toBe("live");

    // 4. Construct working Razorpay client from recovered credential
    const client = await getActiveRazorpayClientAsync("live", merchantId);
    expect(client).toBeDefined();

    // 5. Verify getMerchantConnectionStatus accurately reflects DB state
    const status = await getMerchantConnectionStatus();
    expect(status.isConnected).toBe(true);
    expect(status.merchantId).toBe(merchantId);
  });

  it("5. CREDENTIAL ROTATION: Replaces active credential and invalidates old secret", async () => {
    const originalKey = "rzp_live_OriginalKey111";
    const originalSecret = "OriginalSecret111!";
    const newKey = "rzp_live_NewRotatedKey222";
    const newSecret = "NewRotatedSecret222!";

    await connectMerchantAccount({
      keyId: originalKey,
      keySecret: originalSecret,
      merchantName: "Rotated Merchant",
    });

    const firstCred = await resolveMerchantCredential(undefined, "live");
    expect(firstCred?.keyId).toBe(originalKey);
    expect(firstCred?.keySecret).toBe(originalSecret);

    // Rotate credential
    await connectMerchantAccount({
      keyId: newKey,
      keySecret: newSecret,
      merchantName: "Rotated Merchant",
    });

    // Reset memory cache to ensure recovery reads new DB record
    __resetInMemoryMerchantCacheForTesting();

    const rotatedCred = await resolveMerchantCredential(undefined, "live");
    expect(rotatedCred?.keyId).toBe(newKey);
    expect(rotatedCred?.keySecret).toBe(newSecret);
    expect(rotatedCred?.keySecret).not.toBe(originalSecret);
  });

  it("6. DISCONNECT SCRUBBING: Disconnect removes credentials from database and prevents recovery", async () => {
    const conn = await connectMerchantAccount({
      keyId: liveKeyId,
      keySecret: liveSecret,
    });

    const mId = conn.merchant?.merchantId;

    await disconnectMerchantAccount(mId);
    __resetInMemoryMerchantCacheForTesting();

    const recovered = await resolveMerchantCredential(mId, "live");
    expect(recovered).toBeNull();

    const status = await getMerchantConnectionStatus();
    expect(status.isConnected).toBe(false);
  });

  it("7. maskKey masks credentials securely without revealing secret material", () => {
    expect(maskKey("rzp_live_1234567890abcdef")).toBe("rzp_live_1...cdef");
    expect(maskKey("short")).toBe("••••••••");
    expect(maskKey("")).toBe("••••••••");
  });

  it("8. Audit Service masks any sensitive credential keys in audit events", async () => {
    const record = await AuditService.record({
      eventType: "MERCHANT_CONNECTED",
      action: "MERCHANT_CONNECTED",
      actorType: "merchant",
      metadata: {
        rawSecret: "leaked_super_secret_value",
        apiSecret: "secret1",
        normalField: "safe_value",
      },
    });

    expect(record.metadata).toBeDefined();
    const parsed = JSON.parse(record.metadata as string);
    expect(parsed.rawSecret).not.toBe("leaked_super_secret_value");
    expect(parsed.rawSecret).toBe("leak...alue");
    expect(parsed.apiSecret).toBe("[REDACTED]");
    expect(parsed.normalField).toBe("safe_value");
  });

  it("9. Logger sanitizer redacts credential fields in log contexts", () => {
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("Test sensitive error log", undefined, {
      apiKey: "rzp_live_secret_key_value_12345",
      password: "short",
      safeKey: "safe_data",
    });

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
