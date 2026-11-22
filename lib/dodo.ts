// Pure Dodo webhook decisions (Standard Webhooks signing), kept out of the route so they can be unit tested.
import crypto from "crypto";

/** True when any `v1,<base64>` entry in the signature header is the HMAC-SHA256 of `id.timestamp.body`. */
export function verifyDodoSignature(secret: string, id: string, timestamp: string, rawBody: string, signatureHeader: string): boolean {
  const secretKey = secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : Buffer.from(secret, "utf-8");
  const expectedSig = crypto.createHmac("sha256", secretKey).update(`${id}.${timestamp}.${rawBody}`).digest("base64");

  const signatures = signatureHeader.split(" ").map(s => s.replace(/^v\d+,/, "").trim());
  return signatures.some(sig => {
    try {
      const sigBuf = Buffer.from(sig, "base64");
      const expBuf = Buffer.from(expectedSig, "base64");
      return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  });
}

export type DodoAction = "cancel" | "pause" | "renewal" | "activation" | null;

/** What a webhook means for the subscriber; cancel beats pause beats renewal/activation. null = ignore. */
export function classifyDodoEvent(eventType: string, dataStatus: string): DodoAction {
  const has = (t: string) => eventType.includes(t);
  const updatedTo = (...statuses: string[]) => has("subscription.updated") && statuses.includes(dataStatus);

  if (
    has("subscription.cancelled") || has("subscription.canceled") || has("subscription.expired") ||
    has("payment.cancelled") || has("payment.canceled") ||
    updatedTo("cancelled", "canceled", "expired")
  ) return "cancel";
  if (
    has("subscription.failed") || has("subscription.past_due") || has("subscription.on_hold") ||
    has("subscription.paused") || has("payment.failed") ||
    updatedTo("paused", "on_hold", "past_due", "failed")
  ) return "pause";
  if (has("subscription.renewed")) return "renewal";
  if (
    has("payment.succeeded") || has("subscription.active") || has("subscription.created") ||
    has("subscription.unpaused") || updatedTo("active", "")
  ) return "activation";
  return null;
}
