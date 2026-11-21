import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAsAdmin, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET, POST, PATCH, DELETE } = await import("./route");
const patch = (body: unknown) => PATCH(req("/api/admin/customers", { method: "PATCH", body }));
const row = async (id: string) =>
  (await (await testDb()).execute({ sql: "SELECT * FROM customers WHERE id = ?", args: [id] })).rows[0];

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, created_at) VALUES
    ('da', '${A.key}', 't', 'manual_text', 'x', 1, 0), ('db', '${B.key}', 't', 'manual_text', 'x', 1, 0)`);
  await db.execute(`INSERT INTO request_logs (id, customer_key, timestamp, provider, model, latency_ms, status) VALUES
    ('la', '${A.key}', 0, 'p', 'm', 1, 200), ('lb', '${B.key}', 0, 'p', 'm', 1, 200)`);
  await loginAsAdmin();
});

it("lists every customer without password or session material", async () => {
  const body = await (await GET(req("/api/admin/customers"))).json();
  expect(body.count).toBe(2);
  for (const c of body.customers) {
    expect(c).not.toHaveProperty("password_hash");
    expect(c).not.toHaveProperty("session_token");
  }
});

it("creates an unlimited bot with domains from the website", async () => {
  const { bot } = await (await POST(req("/api/admin/customers", { body: { company: "Acme", website: "https://Acme.io/home", prompts: "a, b" } }))).json();
  expect(bot).toMatchObject({ company: "Acme", monthly_limit: 999999999, status: "active" });
  const saved = await row(bot.id);
  expect(saved).toMatchObject({ key: bot.key, bot_id: bot.bot_id, allowed_domains: '["acme.io"]', prompts: '["a","b"]' });
  expect(String(saved.email)).toMatch(/^acme_.*@internal\.zeroroute\.io$/);
});

it("requires a key or id to update", async () => {
  expect((await patch({ status: "canceled" })).status).toBe(400);
});

it("updates status and limit on the target customer only", async () => {
  await patch({ id: A.id, status: "canceled", monthly_limit: 42 });
  expect(await row(A.id)).toMatchObject({ status: "canceled", monthly_limit: 42 });
  expect(await row(B.id)).toMatchObject({ status: "active", monthly_limit: 10000 });

  await patch({ key: B.key, status: "past_due" });
  expect((await row(B.id)).status).toBe("past_due");
});

it("ignores a non-numeric monthly limit", async () => {
  await patch({ id: A.id, monthly_limit: "999999999" });
  expect((await row(A.id)).monthly_limit).toBe(500);
});

it("rotates a key and moves that customer's documents and logs", async () => {
  const { newKey } = await (await patch({ id: A.id, rotateKey: true })).json();
  expect((await row(A.id)).key).toBe(newKey);
  const db = await testDb();
  expect((await db.execute({ sql: "SELECT id FROM knowledge_documents WHERE customer_key = ?", args: [newKey] })).rows.map((r) => r.id)).toEqual(["da"]);
  expect((await db.execute({ sql: "SELECT id FROM request_logs WHERE customer_key = ?", args: [newKey] })).rows.map((r) => r.id)).toEqual(["la"]);
  expect((await row(B.id)).key).toBe(B.key);
});

it("deletes a customer with their documents and logs, leaving others", async () => {
  expect((await DELETE(req("/api/admin/customers", { method: "DELETE" }))).status).toBe(400);
  expect((await DELETE(req("/api/admin/customers?id=cust_missing", { method: "DELETE" }))).status).toBe(404);

  expect((await DELETE(req(`/api/admin/customers?key=${A.key}`, { method: "DELETE" }))).status).toBe(200);
  const db = await testDb();
  expect(await row(A.id)).toBeUndefined();
  expect((await db.execute("SELECT id FROM knowledge_documents")).rows.map((r) => r.id)).toEqual(["db"]);
  expect((await db.execute("SELECT id FROM request_logs")).rows.map((r) => r.id)).toEqual(["lb"]);
});
