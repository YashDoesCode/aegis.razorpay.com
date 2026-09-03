import crypto from "crypto";

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const computedHex = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    const sigBuffer = Buffer.from(signature.trim(), "utf8");
    const computedBuffer = Buffer.from(computedHex, "utf8");

    if (sigBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, computedBuffer);
  } catch {
    return false;
  }
}

export function computePayloadHash(rawBody: string): string {
  return crypto.createHash("sha256").update(rawBody, "utf8").digest("hex");
}
