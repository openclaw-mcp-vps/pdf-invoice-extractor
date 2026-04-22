import { createHmac, timingSafeEqual } from "crypto";

function safeCompareSignatures(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function verifyStripeSignature(payload: string, signatureHeader: string | null, webhookSecret: string): boolean {
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const [key, value] = part.split("=");
      return { key, value };
    });

  const timestamp = parts.find((part) => part.key === "t")?.value;
  const signatures = parts.filter((part) => part.key === "v1").map((part) => part.value).filter(Boolean) as string[];

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", webhookSecret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((signature) => safeCompareSignatures(signature, expectedSignature));
}
