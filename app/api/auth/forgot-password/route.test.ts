import { beforeEach, expect, it, vi } from "vitest";
import { A, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

const email = vi.hoisted(() => ({ sendPasswordResetOtpEmail: vi.fn(async () => {}) }));
vi.mock("@/lib/email", () => email);
vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { POST } = await import("./route");
let ip = 0;
// A fresh client IP per call keeps the per-IP rate limit out of the way unless a test wants it.
const forgot = (body: unknown, from = `10.0.0.${++ip}`) => POST(req("/api/auth/forgot-password", { body, headers: { "x-real-ip": from } }));
const otp = async (address: string) =>
  (await (await testDb()).execute({ sql: "SELECT * FROM auth_otps WHERE email = ?", args: [address] })).rows[0];

beforeEach(async () => {
  await seedCustomers();
  email.sendPasswordResetOtpEmail.mockClear();
});

it("rejects a missing or malformed email", async () => {
  for (const body of [{}, { email: "not-an-email" }]) expect((await forgot(body)).status).toBe(400);
});

it("stores a 15-minute code and emails it to a known account, matching email case-insensitively", async () => {
  const res = await forgot({ email: "  A@Example.com " });
  expect(res.status).toBe(200);
  const row = await otp(A.email);
  expect(String(row.code)).toMatch(/^\d{6}$/);
  expect(Number(row.expires_at) - Date.now()).toBeGreaterThan(14 * 60_000);
  expect(email.sendPasswordResetOtpEmail).toHaveBeenCalledWith({ email: A.email, otp: row.code });
});

it("gives an unknown email the same success answer without storing or sending anything", async () => {
  const res = await forgot({ email: "nobody@example.com" });
  expect(res.status).toBe(200);
  expect((await res.json()).success).toBe(true);
  expect(await otp("nobody@example.com")).toBeUndefined();
  expect(email.sendPasswordResetOtpEmail).not.toHaveBeenCalled();
});

it("replaces an earlier code and resets its attempt count", async () => {
  await forgot({ email: A.email });
  await (await testDb()).execute({ sql: "UPDATE auth_otps SET code = 'old', attempts = 3 WHERE email = ?", args: [A.email] });
  await forgot({ email: A.email });
  const row = await otp(A.email);
  expect(row.code).not.toBe("old");
  expect(row.attempts).toBe(0);
});

it("rate-limits one client to five requests a minute", async () => {
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await forgot({ email: "nobody@example.com" }, "203.0.113.9")).status);
  expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
});
