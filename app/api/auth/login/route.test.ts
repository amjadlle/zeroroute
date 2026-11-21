import { beforeEach, describe, expect, it } from "vitest";
import { testDb } from "@/tests/db";
import { generateSalt, hashPassword } from "@/lib/auth/password";

const { POST } = await import("./route");

const login = (email: string, password: string) =>
  POST(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": crypto.randomUUID() },
    body: JSON.stringify({ email, password }),
  }) as never);

beforeEach(async () => {
  const db = await testDb();
  await db.execute("DELETE FROM customers");
  const salt = generateSalt();
  const hash = hashPassword("right-password", salt);
  const now = Date.now();
  await db.execute({
    sql: "INSERT INTO customers (id, key, email, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: ["c1", "k1", "has@example.com", hash, salt, now, now],
  });
  await db.execute({
    sql: "INSERT INTO customers (id, key, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    args: ["c2", "k2", "nopass@example.com", now, now],
  });
});

describe("POST /api/auth/login", () => {
  it("gives the same answer for an unknown email, a wrong password and an account without a password", async () => {
    const answers = await Promise.all([
      login("nobody@example.com", "whatever"),
      login("has@example.com", "wrong-password"),
      login("nopass@example.com", "whatever"),
    ]);
    const bodies = await Promise.all(answers.map(r => r.json()));
    expect(answers.map(r => r.status)).toEqual([401, 401, 401]);
    expect(new Set(bodies.map(b => b.error)).size).toBe(1);
  });

  it("signs in with the right password", async () => {
    const res = await login("has@example.com", "right-password");
    expect(res.status).toBe(200);
  });
});
