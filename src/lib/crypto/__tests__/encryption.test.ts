import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, isEncrypted } from "../encryption";

describe("AES-256-GCM Envelope Encryption", () => {
  const sampleSecret = "rzp_live_secret_k8s9d7f6a5b4c3e2";
  const customKey = "my_super_secure_vault_master_key_123!";

  it("encrypts and decrypts a secret successfully", () => {
    const encrypted = encryptSecret(sampleSecret);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted).not.toBe(sampleSecret);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(sampleSecret);
  });

  it("produces unique ciphertexts for identical plaintexts (random IV)", () => {
    const enc1 = encryptSecret(sampleSecret);
    const enc2 = encryptSecret(sampleSecret);

    expect(enc1).not.toBe(enc2);
    expect(decryptSecret(enc1)).toBe(sampleSecret);
    expect(decryptSecret(enc2)).toBe(sampleSecret);
  });

  it("supports custom master keys for envelope encryption and rotation", () => {
    const encrypted = encryptSecret(sampleSecret, customKey);
    expect(isEncrypted(encrypted)).toBe(true);

    const decrypted = decryptSecret(encrypted, customKey);
    expect(decrypted).toBe(sampleSecret);

    expect(() => decryptSecret(encrypted, "wrong_master_key_456")).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("fails when payload is tampered (ciphertext tampering)", () => {
    const encrypted = encryptSecret(sampleSecret);
    const parts = encrypted.split(":");
    const tamperedCiphertext = parts[3].slice(0, -2) + (parts[3].endsWith("aa") ? "bb" : "aa");
    const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedCiphertext}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("fails when payload is tampered (authentication tag tampering)", () => {
    const encrypted = encryptSecret(sampleSecret);
    const parts = encrypted.split(":");
    const tamperedTag = parts[2].slice(0, -2) + (parts[2].endsWith("00") ? "11" : "00");
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedTag}:${parts[3]}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("fails when payload is tampered (IV tampering)", () => {
    const encrypted = encryptSecret(sampleSecret);
    const parts = encrypted.split(":");
    const tamperedIv = parts[1].slice(0, -2) + (parts[1].endsWith("ff") ? "ee" : "ff");
    const tamperedPayload = `${parts[0]}:${tamperedIv}:${parts[2]}:${parts[3]}`;

    expect(() => decryptSecret(tamperedPayload)).toThrow(
      "Failed to decrypt secret: authentication tag mismatch or invalid key"
    );
  });

  it("rejects empty, null, or malformed inputs", () => {
    expect(() => encryptSecret("")).toThrow("Cannot encrypt empty or null plaintext");
    expect(() => decryptSecret("")).toThrow("Cannot decrypt empty or null payload");
    expect(() => decryptSecret("not_encrypted_string")).toThrow("Invalid encrypted payload format");
    expect(() => decryptSecret("v1:tooshort:tag:cipher")).toThrow("Invalid encrypted payload format");
    expect(isEncrypted("plain_secret")).toBe(false);
    expect(isEncrypted("")).toBe(false);
  });
});
