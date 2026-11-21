import { describe, expect, it } from "vitest";
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
