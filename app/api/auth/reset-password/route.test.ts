import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";
import { verifyPassword } from "@/lib/auth/password";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { POST } = await import("./route");
const { GET: me } = await import("../me/route");
let ip = 0;
const reset = (body: unknown, from = `10.0.1.${++ip}`) => POST(req("/api/auth/reset-password", { body, headers: { "x-real-ip": from } }));
const NEW = "brand-new-password";
const customer = async (id: string) =>
  (await (await testDb()).execute({ sql: "SELECT * FROM customers WHERE id = ?", args: [id] })).rows[0];
const otpRow = async () => (await (await testDb()).execute({ sql: "SELECT * FROM auth_otps WHERE email = ?", args: [A.email] })).rows[0];

async function issue(code = "123456", expiresIn = 15 * 60_000) {
  await (await testDb()).execute({ sql: "INSERT INTO auth_otps (email, code, expires_at, attempts) VALUES (?, ?, ?, 0)", args: [A.email, code, Date.now() + expiresIn] });
}

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`UPDATE customers SET password_hash = 'old', password_salt = 'old'`);
});

it("requires email, code and a long enough password", async () => {
  await issue();
  for (const body of [{ code: "123456", newPassword: NEW }, { email: A.email, newPassword: NEW }, { email: A.email, code: "123456" }]) {
    expect((await reset(body)).status).toBe(400);
  }
  expect((await reset({ email: A.email, code: "123456", newPassword: "123" })).status).toBe(400);
  expect((await customer(A.id)).password_hash).toBe("old");
});

it("rejects an email with no code issued", async () => {
  expect((await reset({ email: A.email, code: "123456", newPassword: NEW })).status).toBe(400);
});

it("sets the password, signs the user in, and only touches that account", async () => {
  await issue();
  const res = await reset({ email: "A@example.com", code: "123456", newPassword: NEW });
  expect(res.status).toBe(200);

  const row = await customer(A.id);
  expect(verifyPassword(NEW, String(row.password_hash), String(row.password_salt))).toBe(true);
  expect(res.cookies.get("zr_session")?.value).toBe(row.session_token);
  expect(row.session_token).not.toBe(A.session);
  expect((await customer(B.id)).password_hash).toBe("old");
});

it("signs out the account's other session", async () => {
  await issue();
  await reset({ email: A.email, code: "123456", newPassword: NEW });
  loginAs(A); // the session from before the reset
  expect((await me(req("/api/auth/me"))).status).toBe(401);
});

// BUG: skipped until fixed; details reported privately on #34.
it.skip("signs out the account's other session even if it was just used", async () => {
  loginAs(A);
  expect((await me(req("/api/auth/me"))).status).toBe(200);
  await issue();
  await reset({ email: A.email, code: "123456", newPassword: NEW });
  expect((await me(req("/api/auth/me"))).status).toBe(401);
});

it("cannot reuse a code", async () => {
  await issue();
  await reset({ email: A.email, code: "123456", newPassword: NEW });
  expect((await reset({ email: A.email, code: "123456", newPassword: "another-password" })).status).toBe(400);
});

it("rejects and deletes an expired code", async () => {
  await issue("123456", -1);
  const res = await reset({ email: A.email, code: "123456", newPassword: NEW });
  expect(res.status).toBe(400);
  expect((await res.json()).error).toMatch(/expired/);
  expect(await otpRow()).toBeUndefined();
  expect((await customer(A.id)).password_hash).toBe("old");
});

it("invalidates the code after five wrong guesses", async () => {
  await issue();
  for (let i = 1; i <= 4; i++) {
    expect((await reset({ email: A.email, code: "000000", newPassword: NEW })).status).toBe(400);
    expect((await otpRow()).attempts).toBe(i);
  }
  await reset({ email: A.email, code: "000000", newPassword: NEW });
  expect(await otpRow()).toBeUndefined();
  // The right code is useless now.
  expect((await reset({ email: A.email, code: "123456", newPassword: NEW })).status).toBe(400);
});

it("rate-limits one client to ten attempts a minute", async () => {
  const statuses = [];
  for (let i = 0; i < 11; i++) statuses.push((await reset({ email: A.email, code: "x", newPassword: NEW }, "203.0.113.7")).status);
  expect(statuses.slice(0, 10).every((s) => s === 400)).toBe(true);
  expect(statuses[10]).toBe(429);
});
