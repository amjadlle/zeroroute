import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientIp, isRateLimited } from "./rate-limit";

describe("isRateLimited", () => {
  let n = 0;
  const key = () => `test-key-${++n}`; // the limiter map is module state; never reuse a key across tests

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows exactly `limit` calls per window, then blocks", () => {
    const k = key();
    const results = Array.from({ length: 4 }, () => isRateLimited(k, 3, 1000));
    expect(results).toEqual([false, false, false, true]);
  });

  it("stays blocked up to and including the reset instant, then opens a fresh window", () => {
    const k = key();
    for (let i = 0; i < 2; i++) isRateLimited(k, 2, 1000);
    expect(isRateLimited(k, 2, 1000)).toBe(true);
    vi.advanceTimersByTime(1000); // now === resetAt: still the same window
    expect(isRateLimited(k, 2, 1000)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isRateLimited(k, 2, 1000)).toBe(false);
    expect(isRateLimited(k, 2, 1000)).toBe(false);
    expect(isRateLimited(k, 2, 1000)).toBe(true);
  });

  it("does not extend the window while blocked", () => {
    const k = key();
    isRateLimited(k, 1, 1000);
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(150);
      expect(isRateLimited(k, 1, 1000)).toBe(true);
    }
    vi.advanceTimersByTime(300); // 1050ms after the first call
    expect(isRateLimited(k, 1, 1000)).toBe(false);
  });

  it("tracks keys independently", () => {
    const a = key(), b = key();
    expect(isRateLimited(a, 1, 1000)).toBe(false);
    expect(isRateLimited(a, 1, 1000)).toBe(true);
    expect(isRateLimited(b, 1, 1000)).toBe(false);
  });

  it("defaults to 10 calls per 60s", () => {
    const k = key();
    const results = Array.from({ length: 11 }, () => isRateLimited(k));
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results[10]).toBe(true);
    vi.advanceTimersByTime(60_001);
    expect(isRateLimited(k)).toBe(false);
  });

  it("keeps working after pruning a large map of expired entries", () => {
    for (let i = 0; i < 2100; i++) isRateLimited(`prune-${i}`, 1, 10);
    vi.advanceTimersByTime(20);
    const k = key();
    expect(isRateLimited(k, 1, 1000)).toBe(false);
    expect(isRateLimited(k, 1, 1000)).toBe(true);
  });
});

describe("getClientIp", () => {
  afterEach(() => {
    delete process.env.CLIENT_IP_HEADER;
  });

  it("uses only the platform header (x-real-ip by default), ignoring spoofable ones", () => {
    const h = new Headers({ "x-real-ip": "1.1.1.1", "cf-connecting-ip": "6.6.6.6", "x-forwarded-for": "7.7.7.7" });
    expect(getClientIp(h)).toBe("1.1.1.1");
    expect(getClientIp(new Headers({ "cf-connecting-ip": "6.6.6.6", "x-forwarded-for": "7.7.7.7" }))).toBe("127.0.0.1");
  });

  it("reads the header named by CLIENT_IP_HEADER and takes the proxy-appended entry", () => {
    process.env.CLIENT_IP_HEADER = "x-forwarded-for";
    expect(getClientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("2.2.2.2");
  });

  it("ignores x-real-ip once another header is configured (Cloudflare)", () => {
    process.env.CLIENT_IP_HEADER = "cf-connecting-ip";
    expect(getClientIp(new Headers({ "x-real-ip": "6.6.6.6", "cf-connecting-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(getClientIp(new Headers({ "x-real-ip": "6.6.6.6" }))).toBe("127.0.0.1");
  });

  it("trims whitespace and falls back for blank or trailing-comma values", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "  4.4.4.4  " }))).toBe("4.4.4.4");
    expect(getClientIp(new Headers({ "x-real-ip": "" }))).toBe("127.0.0.1");
    expect(getClientIp(new Headers({ "x-real-ip": "5.5.5.5," }))).toBe("127.0.0.1");
  });

  it("supports IPv6 addresses", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });
});
