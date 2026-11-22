import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { classifyDodoEvent, verifyDodoSignature } from "./dodo";

const sign = (key: Buffer, payload: string) => crypto.createHmac("sha256", key).update(payload).digest("base64");
const body = '{"type":"payment.succeeded"}';

describe("verifyDodoSignature", () => {
  it("accepts a valid signature for a plain secret", () => {
    const sig = sign(Buffer.from("plain_secret"), `id1.100.${body}`);
    expect(verifyDodoSignature("plain_secret", "id1", "100", body, `v1,${sig}`)).toBe(true);
  });

  it("base64-decodes whsec_ secrets", () => {
    const raw = Buffer.from("raw-key-bytes");
    const sig = sign(raw, `id1.100.${body}`);
    expect(verifyDodoSignature(`whsec_${raw.toString("base64")}`, "id1", "100", body, `v1,${sig}`)).toBe(true);
  });

  it("accepts any match among space-separated signatures", () => {
    const sig = sign(Buffer.from("s"), `id1.100.${body}`);
    expect(verifyDodoSignature("s", "id1", "100", body, `v1,AAAA v1,${sig}`)).toBe(true);
  });

  it("rejects a changed body, id or timestamp, and junk", () => {
    const sig = sign(Buffer.from("s"), `id1.100.${body}`);
    expect(verifyDodoSignature("s", "id1", "100", `${body} `, `v1,${sig}`)).toBe(false);
    expect(verifyDodoSignature("s", "id2", "100", body, `v1,${sig}`)).toBe(false);
    expect(verifyDodoSignature("s", "id1", "101", body, `v1,${sig}`)).toBe(false);
    expect(verifyDodoSignature("s", "id1", "100", body, "v1,not-base64!!")).toBe(false);
    expect(verifyDodoSignature("s", "id1", "100", body, "")).toBe(false);
  });
});

describe("classifyDodoEvent", () => {
  it.each([
    ["subscription.cancelled", "", "cancel"],
    ["subscription.expired", "", "cancel"],
    ["payment.canceled", "", "cancel"],
    ["subscription.updated", "canceled", "cancel"],
    ["subscription.on_hold", "", "pause"],
    ["payment.failed", "", "pause"],
    ["subscription.updated", "past_due", "pause"],
    ["subscription.renewed", "", "renewal"],
    ["payment.succeeded", "", "activation"],
    ["subscription.created", "", "activation"],
    ["subscription.unpaused", "", "activation"],
    ["subscription.updated", "active", "activation"],
    ["subscription.updated", "", "activation"],
    ["subscription.updated", "weird", null],
    ["refund.succeeded", "", null],
    ["", "", null],
  ])("%s with status %j is %s", (type, status, expected) => {
    expect(classifyDodoEvent(type, status)).toBe(expected);
  });
});
