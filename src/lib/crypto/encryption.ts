import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits standard for GCM
const TAG_LENGTH = 16; // 128 bits authentication tag
const VERSION_PREFIX = "v1";

const HEX_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Validates the current server-side encryption key configuration.
 * In production (NODE_ENV === "production"), fails closed if no master key is configured.
 */
export function validateEncryptionConfig(): {
  valid: boolean;
  algorithm: string;
  version: string;
  keySource: "custom" | "env" | "fallback_dev";
} {
  const envKey =
    process.env.AEGIS_ENCRYPTION_KEY ||
    process.env.AEGIS_MASTER_KEY ||
    process.env.ENCRYPTION_KEY;

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && (!envKey || envKey.trim().length === 0)) {
    throw new Error(
      "[Aegis Security] Master encryption key is missing in production environment. Configure AEGIS_ENCRYPTION_KEY."
    );
  }

  if (isProduction && envKey && envKey.trim().length < 16) {
    throw new Error(
      "[Aegis Security] Configured encryption key has insufficient entropy (< 16 characters)."
    );
  }

  return {
    valid: true,
    algorithm: ALGORITHM,
    version: VERSION_PREFIX,
    keySource: envKey ? "env" : "fallback_dev",
  };
}

/**
 * Derives a deterministic 256-bit (32 bytes) Buffer key for AES-256-GCM.
 */
function getMasterKey(customKey?: string): Buffer {
  if (customKey && customKey.trim().length > 0) {
    const trimmed = customKey.trim();
    if (trimmed.length === 64 && HEX_REGEX.test(trimmed)) {
      return Buffer.from(trimmed, "hex");
    }
    return crypto.createHash("sha256").update(trimmed, "utf8").digest();
  }

  const envKey =
    process.env.AEGIS_ENCRYPTION_KEY ||
    process.env.AEGIS_MASTER_KEY ||
    process.env.ENCRYPTION_KEY;

  if (envKey && envKey.trim().length > 0) {
    const trimmed = envKey.trim();
    if (trimmed.length === 64 && HEX_REGEX.test(trimmed)) {
      return Buffer.from(trimmed, "hex");
    }
    return crypto.createHash("sha256").update(trimmed, "utf8").digest();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[Aegis Security] Master encryption key is not configured in production environment. Set AEGIS_ENCRYPTION_KEY."
    );
  }

  // Safe fallback for local development and test environments only
  const devFallback = "aegis_default_dev_master_key_32b_hex";
  return crypto.createHash("sha256").update(devFallback, "utf8").digest();
}

/**
 * Encrypts a plaintext secret using AES-256-GCM with a random 96-bit IV.
 * Returns a versioned, tamper-evident envelope string: `v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`
 */
export function encryptSecret(plaintext: string, customMasterKey?: string): string {
  if (typeof plaintext !== "string" || !plaintext || plaintext.trim().length === 0) {
    throw new Error("Cannot encrypt empty or null plaintext");
  }

  const key = getMasterKey(customMasterKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${VERSION_PREFIX}:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/**
 * Decrypts a versioned AES-256-GCM ciphertext payload.
 * Verifies authenticity via GCM tag; fails closed on tampering or key mismatch.
 */
export function decryptSecret(payload: string, customMasterKey?: string): string {
  if (typeof payload !== "string" || !payload || payload.trim().length === 0) {
    throw new Error("Cannot decrypt empty or null payload");
  }

  if (!isEncrypted(payload)) {
    throw new Error("Invalid encrypted payload format");
  }

  const parts = payload.split(":");
  if (parts.length !== 4) {
    throw new Error("Malformed encrypted payload");
  }

  const [version, ivHex, tagHex, ciphertextHex] = parts;

  if (version !== VERSION_PREFIX) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
    throw new Error("Invalid IV or authentication tag length");
  }

  const key = getMasterKey(customMasterKey);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw new Error("Failed to decrypt secret: authentication tag mismatch or invalid key");
  }
}

/**
 * Checks whether a given string is a valid versioned encrypted payload.
 */
export function isEncrypted(payload: unknown): boolean {
  if (typeof payload !== "string" || !payload) {
    return false;
  }
  const parts = payload.split(":");
  if (parts.length !== 4) {
    return false;
  }

  const [version, ivHex, tagHex, ciphertextHex] = parts;

  return (
    version === VERSION_PREFIX &&
    ivHex.length === IV_LENGTH * 2 &&
    HEX_REGEX.test(ivHex) &&
    tagHex.length === TAG_LENGTH * 2 &&
    HEX_REGEX.test(tagHex) &&
    ciphertextHex.length > 0 &&
    HEX_REGEX.test(ciphertextHex)
  );
}

/**
 * Extracts the version identifier from an encrypted payload, or returns null if invalid.
 */
export function getCiphertextVersion(payload: unknown): string | null {
  if (typeof payload !== "string" || !isEncrypted(payload)) {
    return null;
  }
  return payload.split(":")[0];
}

