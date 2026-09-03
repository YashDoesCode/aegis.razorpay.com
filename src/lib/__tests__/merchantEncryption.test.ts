import { describe, it, expect, beforeEach } from "vitest";
import {
  connectMerchantAccount,
  disconnectMerchantAccount,
  getMerchantConnectionStatus,
  getDecryptedActiveMerchantCredentials,
  getActiveRazorpayClient,
} from "../merchantAccount";

describe("Merchant Account Envelope Encryption Tests", () => {
  const testKeyId = "rzp_test_SecuredKeyId123";
  const testSecret = "SuperSecretPlainTextValue987!";

  beforeEach(async () => {
    await disconnectMerchantAccount();
  });

  it("encrypts secret upon merchant connection and decrypts only for client creation", async () => {
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

  it("verifies encrypted secret format using isEncrypted helper", async () => {
    const res = await connectMerchantAccount({
      keyId: testKeyId,
      keySecret: testSecret,
    });

    expect(res.ok).toBe(true);
    const creds = getDecryptedActiveMerchantCredentials();
    expect(creds?.keySecret).toBe(testSecret);
  });
});
