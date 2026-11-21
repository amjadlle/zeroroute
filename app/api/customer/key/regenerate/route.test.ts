import { beforeEach, expect, it, vi } from "vitest";
import { A, B, jar, loginAs, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { POST } = await import("./route");
const { GET: profile } = await import("../../profile/route");
const rotate = (bearer?: string) => POST(req("/api/customer/key/regenerate", { method: "POST", bearer }));
const profileStatus = async (bearer: string) => (await profile(req("/api/customer/profile", { bearer }))).status;

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, created_at) VALUES
    ('da', '${A.key}', 't', 'manual_text', 'x', 1, 0), ('db', '${B.key}', 't', 'manual_text', 'x', 1, 0)`);
  await db.execute(`INSERT INTO request_logs (id, customer_key, timestamp, provider, model, latency_ms, status) VALUES
    ('la', '${A.key}', 0, 'p', 'm', 1, 200), ('lb', '${B.key}', 0, 'p', 'm', 1, 200)`);
});

it("rotates the session owner's key and moves only their documents and logs", async () => {
  loginAs(A);
  const { key } = await (await rotate()).json();
  expect(key).toMatch(/^zr_live_/);
  expect(key).not.toBe(A.key);

  const db = await testDb();
  const keys = Object.fromEntries((await db.execute("SELECT id, key FROM customers")).rows.map((r) => [r.id, r.key]));
  expect(keys).toEqual({ [A.id]: key, [B.id]: B.key });
  const owner = async (table: string, id: string) =>
    (await db.execute({ sql: `SELECT customer_key FROM ${table} WHERE id = ?`, args: [id] })).rows[0].customer_key;
  expect(await owner("knowledge_documents", "da")).toBe(key);
  expect(await owner("request_logs", "la")).toBe(key);
  expect(await owner("knowledge_documents", "db")).toBe(B.key);
  expect(await owner("request_logs", "lb")).toBe(B.key);
});

it("lets the new key authenticate and rejects the old one", async () => {
  loginAs(A);
  const { key } = await (await rotate()).json();
  jar.session = undefined;
  expect(await profileStatus(key)).toBe(200);
  expect(await profileStatus(A.key)).toBe(401);
});

it("rejects the old key right after rotation even if it was just used", async () => {
  expect(await profileStatus(B.key)).toBe(200);
  await rotate(B.key);
  expect(await profileStatus(B.key)).toBe(401);
});
