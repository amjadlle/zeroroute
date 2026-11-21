import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDb } from "@/tests/db";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import { POST } from "./route";

it("does not let an API key alone set a password or get a session", async () => {
  const db = await testDb();
  await db.execute(
    "INSERT INTO customers (id, key, email, password_hash, password_salt, session_token, status, created_at, updated_at) VALUES ('cust_1', 'zr_live_cust1', 'c@example.com', 'oldhash', 'oldsalt', 'zr_sess_cust1', 'active', 0, 0)"
  );

  for (const token of ["zr_live_cust1", "cust_1"]) {
    const res = await POST(new NextRequest("http://localhost/api/onboarding/setup", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ token, password: "attacker-pass" }),
    }));
    expect(res.status).toBe(401);
    expect(res.cookies.get("zr_session")).toBeUndefined();
  }

  const { rows } = await db.execute("SELECT password_hash FROM customers WHERE id = 'cust_1'");
  expect(rows[0].password_hash).toBe("oldhash");
});
