import crypto from "crypto";
import { describe, expect, it, vi } from "vitest";
import {
  generateApiKey, generateBotId, generateOtp, generateSalt, generateSessionToken,
  hashPassword, verifyPassword,
} from "./password";

describe("password hashing", () => {
  it("verifies the right password and rejects a wrong one", () => {
    const salt = generateSalt();
    const hash = hashPassword("correct horse", salt);
    expect(verifyPassword("correct horse", hash, salt)).toBe(true);
    expect(verifyPassword("wrong horse", hash, salt)).toBe(false);
  });

  it("returns false instead of throwing on a malformed stored hash", () => {
    expect(verifyPassword("x", "not-hex", generateSalt())).toBe(false);
  });
});

describe("token generators", () => {
  it.each([
    ["api key", generateApiKey, /^zr_live_[0-9a-f]{48}$/],
    ["session token", generateSessionToken, /^zr_sess_[0-9a-f]{64}$/],
    ["bot id", generateBotId, /^bot_[0-9a-f]{24}$/],
    ["otp", generateOtp, /^\d{6}$/],
  ])("%s has the expected format and is unique", (_, gen, pattern) => {
    const a = gen(), b = gen();
    expect(a).toMatch(pattern);
    if (gen !== generateOtp) expect(a).not.toBe(b);
  });
});

describe("password hashing details", () => {
  it("is deterministic per salt and salted per user", () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(hashPassword("pw", salt)).toBe(hashPassword("pw", salt));
    expect(hashPassword("pw", salt)).toMatch(/^[0-9a-f]{128}$/);
    expect(hashPassword("pw", generateSalt())).not.toBe(hashPassword("pw", salt));
  });

  it("rejects the right password under the wrong salt", () => {
    const salt = generateSalt();
    expect(verifyPassword("pw", hashPassword("pw", salt), generateSalt())).toBe(false);
  });

  it("compares with crypto.timingSafeEqual", () => {
    const spy = vi.spyOn(crypto, "timingSafeEqual");
    const salt = generateSalt();
    verifyPassword("pw", hashPassword("pw", salt), salt);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("returns false (not throw) for a truncated or empty stored hash", () => {
    const salt = generateSalt();
    const hash = hashPassword("pw", salt);
    expect(verifyPassword("pw", hash.slice(0, 64), salt)).toBe(false);
    expect(verifyPassword("pw", "", salt)).toBe(false);
  });
});

describe("token generator uniqueness", () => {
  it("does not repeat across many API keys, session tokens and bot ids", () => {
    for (const gen of [generateApiKey, generateSessionToken, generateBotId]) {
      expect(new Set(Array.from({ length: 500 }, gen)).size).toBe(500);
    }
  });

  it("keeps OTPs in the 6-digit range (no leading-zero short codes)", () => {
    for (let i = 0; i < 2000; i++) {
      const n = Number(generateOtp());
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });
});
