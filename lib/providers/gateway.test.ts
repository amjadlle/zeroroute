import { describe, expect, it } from "vitest";
import { CHAT_LIMITS, chatBodyError, contentText, isDemoOrigin, isFailoverError, isHostAllowed, isSameOrigin } from "./gateway";
import { UpstreamError } from "./providers";

describe("isDemoOrigin", () => {
  it("accepts only the official hosts", () => {
    expect(isDemoOrigin("https://zeroroute.mapki.in", false)).toBe(true);
    expect(isDemoOrigin("https://zeroroute.mapki.in/pricing", false)).toBe(true);
    expect(isDemoOrigin("https://mapki.in.evil.com", false)).toBe(false);
    expect(isDemoOrigin("https://evil.com/?mapki.in", false)).toBe(false);
    expect(isDemoOrigin("https://example.com", false)).toBe(false);
    expect(isDemoOrigin(null, false)).toBe(false);
    expect(isDemoOrigin("null", false)).toBe(false);
  });

  it("allows localhost only when asked", () => {
    expect(isDemoOrigin("http://localhost:3000", false)).toBe(false);
    expect(isDemoOrigin("http://localhost:3000", true)).toBe(true);
  });
});

describe("isHostAllowed", () => {
  it("matches hosts exactly", () => {
    expect(isHostAllowed("https://shop.com", ["shop.com"])).toBe(true);
    expect(isHostAllowed("https://shop.com:8443", ["https://shop.com/"])).toBe(true);
    expect(isHostAllowed("https://www.shop.com", ["shop.com"])).toBe(false);
    expect(isHostAllowed("https://shop.com.evil.com", ["shop.com"])).toBe(false);
    expect(isHostAllowed("https://evil.com/?x=.shop.com", ["shop.com"])).toBe(false);
    expect(isHostAllowed("", ["shop.com"])).toBe(false);
  });

  it("supports explicit wildcards", () => {
    expect(isHostAllowed("https://www.shop.com", ["*.shop.com"])).toBe(true);
    expect(isHostAllowed("https://evilshop.com", ["*.shop.com"])).toBe(false);
    expect(isHostAllowed("", ["*"])).toBe(true);
  });
});

describe("isSameOrigin", () => {
  it("allows no Origin or a matching host only", () => {
    expect(isSameOrigin(null, "zeroroute.mapki.in")).toBe(true);
    expect(isSameOrigin("https://zeroroute.mapki.in", "zeroroute.mapki.in")).toBe(true);
    expect(isSameOrigin("https://blog.mapki.in", "zeroroute.mapki.in")).toBe(false);
    expect(isSameOrigin("null", "zeroroute.mapki.in")).toBe(false);
  });
});

describe("chatBodyError", () => {
  const msg = (content: unknown) => ({ role: "user", content });

  it("accepts a normal body", () => {
    expect(chatBodyError({ messages: [msg("hi")], max_tokens: 100 })).toBeNull();
  });

  it("rejects empty, oversized, or malformed bodies", () => {
    expect(chatBodyError({ messages: [] })?.status).toBe(400);
    expect(chatBodyError({ messages: Array(CHAT_LIMITS.maxMessages + 1).fill(msg("a")) })?.status).toBe(413);
    expect(chatBodyError({ messages: [msg("a".repeat(CHAT_LIMITS.maxMessageChars + 1))] })?.status).toBe(413);
    const big = "a".repeat(CHAT_LIMITS.maxMessageChars);
    expect(chatBodyError({ messages: [msg(big), msg(big), msg(big), msg("a")] })?.status).toBe(413);
    expect(chatBodyError({ messages: [msg("hi")], max_tokens: -1 })?.status).toBe(400);
    expect(chatBodyError({ messages: [msg("hi")], max_tokens: "9" })?.status).toBe(400);
  });
});

describe("message shape (#40, #43)", () => {
  it("rejects unknown roles and malformed content", () => {
    expect(chatBodyError({ messages: [{ role: "admin", content: "hi" }] })?.status).toBe(400);
    expect(chatBodyError({ messages: [{ role: "user", content: 42 }] })?.status).toBe(400);
    expect(chatBodyError({ messages: [{ role: "user", content: [{ type: "text", text: 1 }] }] })?.status).toBe(400);
    expect(chatBodyError({ messages: [null] })?.status).toBe(400);
  });

  it("accepts text-part arrays and measures their text", () => {
    expect(chatBodyError({ messages: [{ role: "user", content: [{ type: "text", text: "hi" }, { type: "image_url" }] }] })).toBeNull();
    const big = [{ type: "text", text: "a".repeat(CHAT_LIMITS.maxMessageChars + 1) }];
    expect(chatBodyError({ messages: [{ role: "user", content: big }] })?.status).toBe(413);
  });

  it("contentText joins text parts and drops the rest", () => {
    expect(contentText("plain")).toBe("plain");
    expect(contentText([{ type: "text", text: "a" }, { type: "image_url" }, { type: "text", text: "b" }])).toBe("a\nb");
    expect(contentText(null)).toBe("");
  });
});

describe("isFailoverError (#40)", () => {
  it("does not fail over on request errors", () => {
    for (const s of [400, 413, 422]) expect(isFailoverError(new UpstreamError("bad", s))).toBe(false);
  });

  it("fails over on provider errors and timeouts", () => {
    for (const s of [401, 404, 429, 500, 503]) expect(isFailoverError(new UpstreamError("down", s))).toBe(true);
    expect(isFailoverError(new Error("timed out"))).toBe(true);
  });
});
