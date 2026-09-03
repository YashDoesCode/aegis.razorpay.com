import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  encryptSecret,
  decryptSecret,
  isEncrypted,
  getCiphertextVersion,
  validateEncryptionConfig,
} from "../encryption";

describe("AES-256-GCM Envelope Encryption Service", () => {
  const sampleSecret = "rzp_live_secret_k8s9d7f6a5b4c3e2";
  const customKey = "my_super_secure_vault_master_key_123!";
  const customHexKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("1. Encrypt/decrypt round trip succeeds with default key", () => {
    const encrypted = encryptSecret(sampleSecret);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted).not.toBe(sampleSecret);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(sampleSecret);
  });

  it("2. Produces unique ciphertexts for identical plaintexts (cryptographically random IV)", () => {
    const enc1 = encryptSecret(sampleSecret);
    const enc2 = encryptSecret(sampleSecret);
    const enc3 = encryptSecret(sampleSecret);

    expect(enc1).not.toBe(enc2);
    expect(enc2).not.toBe(enc3);
    expect(enc1).not.toBe(enc3);

    expect(decryptSecret(enc1)).toBe(sampleSecret);
    expect(decryptSecret(enc2)).toBe(sampleSecret);
    expect(decryptSecret(enc3)).toBe(sampleSecret);
  });

  it("3. Plaintext is never present in ciphertext representation", () => {
    const secretWord = "UncompromisedFintechKeySecret999";
    const encrypted = encryptSecret(secretWord);

    expect(encrypted).not.toContain(secretWord);
    expect(encrypted.toLowerCase()).not.toContain(secretWord.toLowerCase());
  });

  it("4. Supports 64-character hex master keys and custom rotation keys", () => {
    const encryptedHex = encryptSecret(sampleSecret, customHexKey);
    expect(isEncrypted(encryptedHex)).toBe(true);
    const decryptedHex = decryptSecret(encryptedHex, customHexKey);
    expect(decryptedHex).toBe(sampleSecret);

    const encryptedString = encryptSecret(sampleSecret, customKey);
    expect(isEncrypted(encryptedString)).toBe(true);
    const decryptedString = decryptSecret(encryptedString, customKey);
    expect(decryptedString).toBe(sampleSecret);

    expect(() => decryptSecret(encryptedHex, "wrong_master_key_456")).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("5. Tampered ciphertext fails closed", () => {
    const encrypted = encryptSecret(sampleSecret);
    const parts = encrypted.split(":");
    const tamperedCiphertext = parts[3].slice(0, -2) + (parts[3].endsWith("aa") ? "bb" : "aa");
    const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedCiphertext}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("6. Tampered authentication tag fails closed", () => {
    const encrypted = encryptSecret(sampleSecret);
    const parts = encrypted.split(":");
    const tamperedTag = parts[2].slice(0, -2) + (parts[2].endsWith("00") ? "11" : "00");
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedTag}:${parts[3]}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("7. Tampered IV fails closed", () => {
    const encrypted = encryptSecret(sampleSecret);
    const parts = encrypted.split(":");
    const tamperedIv = parts[1].slice(0, -2) + (parts[1].endsWith("ff") ? "ee" : "ff");
    const tamperedPayload = `${parts[0]}:${tamperedIv}:${parts[2]}:${parts[3]}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("8. Unsupported ciphertext version fails safely", () => {
    const encrypted = encryptSecret(sampleSecret);
    const parts = encrypted.split(":");
    const futureVersionPayload = `v2:${parts[1]}:${parts[2]}:${parts[3]}`;

    // Note: isEncrypted checks for v1, so direct decrypt on unsupported version
    expect(() => decryptSecret(futureVersionPayload)).toThrow("Invalid encrypted payload format");
  });

  it("9. Malformed ciphertext formats fail safely", () => {
    expect(() => decryptSecret("not_encrypted_string")).toThrow("Invalid encrypted payload format");
    expect(() => decryptSecret("v1:tooshort:tag:cipher")).toThrow("Invalid encrypted payload format");
    expect(() => decryptSecret("v1:zzzzzzzzzzzzzzzzzzzzzzzz:00000000000000000000000000000000:abcd")).toThrow(
      "Invalid encrypted payload format"
    );
    expect(() => decryptSecret("")).toThrow("Cannot decrypt empty or null payload");
  });

  it("10. Rejects empty, null, or whitespace inputs for encryption", () => {
    expect(() => encryptSecret("")).toThrow("Cannot encrypt empty or null plaintext");
    expect(() => encryptSecret("   ")).toThrow("Cannot encrypt empty or null plaintext");
    // @ts-expect-error Testing runtime boundary
    expect(() => encryptSecret(null)).toThrow("Cannot encrypt empty or null plaintext");
    // @ts-expect-error Testing runtime boundary
    expect(() => encryptSecret(undefined)).toThrow("Cannot encrypt empty or null plaintext");
  });

  it("11. Validates isEncrypted helper strictly against format and hex boundaries", () => {
    const valid = encryptSecret("test_value");
    expect(isEncrypted(valid)).toBe(true);
    expect(isEncrypted("plain_secret")).toBe(false);
    expect(isEncrypted("")).toBe(false);
    expect(isEncrypted(null)).toBe(false);
    expect(isEncrypted(undefined)).toBe(false);
    expect(isEncrypted(12345)).toBe(false);
    expect(isEncrypted("v1:1234:5678:90")).toBe(false);
  });

  it("12. getCiphertextVersion extracts version or returns null", () => {
    const valid = encryptSecret("test_value");
    expect(getCiphertextVersion(valid)).toBe("v1");
    expect(getCiphertextVersion("plaintext")).toBeNull();
    expect(getCiphertextVersion(null)).toBeNull();
  });

  it("13. validateEncryptionConfig fails closed in production when key is missing", () => {
    delete process.env.AEGIS_ENCRYPTION_KEY;
    delete process.env.AEGIS_MASTER_KEY;
    delete process.env.ENCRYPTION_KEY;
    Object.assign(process.env, { NODE_ENV: "production" });

    expect(() => validateEncryptionConfig()).toThrow(
      "[Aegis Security] Master encryption key is missing in production environment. Configure AEGIS_ENCRYPTION_KEY."
    );

    expect(() => encryptSecret("test")).toThrow(
      "[Aegis Security] Master encryption key is not configured in production environment. Set AEGIS_ENCRYPTION_KEY."
    );
  });

  it("14. validateEncryptionConfig passes in production when secure key is provided", () => {
    Object.assign(process.env, {
      NODE_ENV: "production",
      AEGIS_ENCRYPTION_KEY: "my_production_aes_master_secret_key_32_bytes",
    });

    const config = validateEncryptionConfig();
    expect(config.valid).toBe(true);
    expect(config.algorithm).toBe("aes-256-gcm");
    expect(config.version).toBe("v1");
    expect(config.keySource).toBe("env");
  });
});

