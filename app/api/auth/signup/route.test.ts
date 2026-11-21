import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDb } from "@/tests/db";

vi.hoisted(() => {
  process.env.ADMIN_EMAIL = "owner@example.com";
});

import { POST } from "./route";

it("rejects signup with the admin email", async () => {
  const db = await testDb();
  const res = await POST(new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email: "Owner@Example.com", password: "secret123" }),
  }));
  expect(res.status).toBe(403);
  const { rows } = await db.execute("SELECT id FROM customers WHERE email = 'owner@example.com'");
  expect(rows).toHaveLength(0);
});
