import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const VERSION_PREFIX = "v1";

function getMasterKey(customKey?: string): Buffer {
  const secret = customKey || process.env.AEGIS_MASTER_KEY || process.env.ENCRYPTION_KEY || "aegis_default_dev_master_key_32b_hex";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string, customMasterKey?: string): string {
  if (!plaintext) {
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

export function decryptSecret(payload: string, customMasterKey?: string): string {
  if (!payload) {
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

export function isEncrypted(payload: string): boolean {
  if (typeof payload !== "string") {
    return false;
  }
  const parts = payload.split(":");
  return (
    parts.length === 4 &&
    parts[0] === VERSION_PREFIX &&
    parts[1].length === IV_LENGTH * 2 &&
    parts[2].length === TAG_LENGTH * 2 &&
    parts[3].length > 0
  );
}
