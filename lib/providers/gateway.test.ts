import { describe, expect, it } from "vitest";
import {
  CHAT_LIMITS, MAX_ATTEMPTS, MAX_WALL_MS, attemptTimeoutMs, chatBodyError, cleanDomains, contentText, domainLimitError, inactiveMessage,
  isDemoOrigin, isFailoverError, isHostAllowed, isSameOrigin, modelChain, parseAllowedDomains, providerFailure, quotaExceededMessage,
  quotaLimit, renewedPeriod
} from "./gateway";
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
  // The server binds as localhost, so request.url says localhost whatever address the browser used.
  const req = (headers: Record<string, string>) => new Request("http://localhost:3000/v1/chat/completions", { headers });

  it("allows no Origin or a matching host only", () => {
    expect(isSameOrigin(req({ host: "zeroroute.mapki.in" }))).toBe(true);
    expect(isSameOrigin(req({ host: "zeroroute.mapki.in", origin: "https://zeroroute.mapki.in" }))).toBe(true);
    expect(isSameOrigin(req({ host: "zeroroute.mapki.in", origin: "https://blog.mapki.in" }))).toBe(false);
    expect(isSameOrigin(req({ host: "zeroroute.mapki.in", origin: "null" }))).toBe(false);
  });

  it("compares with the Host the browser used, not the server's bind name", () => {
    expect(isSameOrigin(req({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }))).toBe(true);
    expect(isSameOrigin(req({ host: "127.0.0.1:3000", origin: "http://localhost:3000" }))).toBe(false);
    expect(isSameOrigin(req({ host: "Zeroroute.Mapki.in", origin: "https://zeroroute.mapki.in" }))).toBe(true);
  });

  it("prefers the proxy's x-forwarded-host over the internal Host", () => {
    const behindProxy = { host: "internal.vercel.app", "x-forwarded-host": "zeroroute.mapki.in, internal.vercel.app" };
    expect(isSameOrigin(req({ ...behindProxy, origin: "https://zeroroute.mapki.in" }))).toBe(true);
    expect(isSameOrigin(req({ ...behindProxy, origin: "https://internal.vercel.app" }))).toBe(false);
    expect(isSameOrigin(req({ ...behindProxy, origin: "https://evil.example" }))).toBe(false);
  });

  it("falls back to the request URL host when no Host header is present", () => {
    expect(isSameOrigin(req({ origin: "http://localhost:3000" }))).toBe(true);
    expect(isSameOrigin(req({ origin: "https://evil.example" }))).toBe(false);
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

describe("modelChain (#38)", () => {
  it("uses the configured models, else the provider default", () => {
    expect(modelChain(["a", "b"], "d")).toEqual(["a", "b"]);
    expect(modelChain([], "d")).toEqual(["d"]);
    expect(modelChain(undefined, "d", "x")).toEqual(["d"]);
  });

  it("moves the requested model to the front, case-insensitively, without mutating the input", () => {
    const models = ["a", "B", "c"];
    expect(modelChain(models, "d", "b")).toEqual(["B", "a", "c"]);
    expect(models).toEqual(["a", "B", "c"]);
  });

  it("ignores auto, default, unknown and already-first models", () => {
    for (const target of ["auto", "default", "zzz", "a"]) expect(modelChain(["a", "b"], "d", target)).toEqual(["a", "b"]);
  });
});

describe("attemptTimeoutMs (#38)", () => {
  it("gives the full per-attempt timeout while the budget lasts", () => {
    expect(attemptTimeoutMs(0, 0, 10_000)).toBe(10_000);
  });

  it("caps the timeout at the wall time left", () => {
    expect(attemptTimeoutMs(1, MAX_WALL_MS - 2_000, 10_000)).toBe(2_000);
  });

  it("returns 0 once attempts or wall time run out", () => {
    expect(attemptTimeoutMs(MAX_ATTEMPTS, 0, 10_000)).toBe(0);
    expect(attemptTimeoutMs(0, MAX_WALL_MS, 10_000)).toBe(0);
  });
});

describe("providerFailure (#38)", () => {
  it("counts the failure and sets the cooldown", () => {
    expect(providerFailure(undefined, "boom", 1_000, 500)).toEqual({ consecutiveFailures: 1, cooldownUntil: 1_500, lastError: "boom" });
    expect(providerFailure(2, "again", 0, 10)).toEqual({ consecutiveFailures: 3, cooldownUntil: 10, lastError: "again" });
  });
});

describe("parseAllowedDomains (#38)", () => {
  it("reads JSON text or arrays", () => {
    expect(parseAllowedDomains('["a.com"]')).toEqual(["a.com"]);
    expect(parseAllowedDomains(["b.com"])).toEqual(["b.com"]);
  });

  it("treats empty, invalid or non-array values as no allowlist", () => {
    for (const v of [null, undefined, "", "not json", '{"a":1}', 42]) expect(parseAllowedDomains(v)).toEqual([]);
  });
});

describe("quota decisions (#38)", () => {
  it("defaults a missing limit to 500 but keeps stored values", () => {
    expect(quotaLimit(undefined)).toBe(500);
    expect(quotaLimit(10000)).toBe(10000);
    expect(quotaLimit("25")).toBe(25);
  });

  it("starts a new 30-day period only after the current one ends", () => {
    expect(renewedPeriod(0, 5)).toBeNull();
    expect(renewedPeriod(null, 5)).toBeNull();
    expect(renewedPeriod(10, 10)).toBeNull();
    expect(renewedPeriod(10, 11)).toEqual({ start: 11, end: 11 + 30 * 24 * 60 * 60 * 1000 });
  });

  it("hides billing details from widget visitors", () => {
    expect(inactiveMessage("paused", false)).toContain("inactive (paused)");
    expect(inactiveMessage("paused", true)).not.toContain("paused");
    expect(quotaExceededMessage(500, false)).toContain("(500/500 used)");
    expect(quotaExceededMessage(500, true)).toContain("website owner");
  });
});

describe("cleanDomains / domainLimitError (#38)", () => {
  it("strips protocol, path and port, lowercases and dedupes", () => {
    expect(cleanDomains(["https://Shop.Example.com/path", "shop.example.com:8080", " http://a.io ", "x", "", null])).toEqual([
      "shop.example.com",
      "a.io",
    ]);
  });

  it("treats a non-array as empty", () => {
    expect(cleanDomains("a.com")).toEqual([]);
  });

  it("allows 1 domain on free and 3 on Pro", () => {
    expect(domainLimitError(1, 500)).toBeNull();
    expect(domainLimitError(2, 500)).toContain("Free accounts");
    expect(domainLimitError(2, null)).toContain("Free accounts");
    expect(domainLimitError(3, 10000)).toBeNull();
    expect(domainLimitError(4, 10000)).toContain("Pro accounts");
  });
});
