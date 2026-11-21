import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, loginAsAdmin, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET, POST, DELETE } = await import("./route");
const list = async (qs = "") => (await (await GET(req(`/api/knowledge${qs}`))).json()).documents?.map((d: { id: string }) => d.id);
const add = (body: unknown) => POST(req("/api/knowledge", { body }));
const remove = (id: string) => DELETE(req(`/api/knowledge?id=${id}`, { method: "DELETE" }));
const ownerOf = async (id: string) =>
  (await (await testDb()).execute({ sql: "SELECT customer_key FROM knowledge_documents WHERE id = ?", args: [id] })).rows[0]?.customer_key;

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, created_at) VALUES
    ('doc_a', '${A.key}', 'A', 'manual_text', 'about A', 7, 1),
    ('doc_b', '${B.key}', 'B', 'manual_text', 'about B', 7, 2)`);
});

it("rejects every method without a session", async () => {
  expect((await GET(req("/api/knowledge"))).status).toBe(401);
  expect((await add({ content: "x" })).status).toBe(401);
  expect((await remove("doc_a")).status).toBe(401);
  expect(await ownerOf("doc_a")).toBe(A.key);
});

it("does not accept an API key in place of a session", async () => {
  expect((await GET(req("/api/knowledge", { bearer: A.key }))).status).toBe(401);
});

it("lists only the session owner's documents", async () => {
  loginAs(A);
  expect(await list()).toEqual(["doc_a"]);
});

it("adds a document to the session owner and trims it", async () => {
  loginAs(A);
  const res = await add({ title: "  FAQ  ", content: "  Opening hours 9-5  " });
  const { document } = await res.json();
  expect(document).toMatchObject({ title: "FAQ", type: "manual_text", char_count: 17 });
  expect(await ownerOf(document.id)).toBe(A.key);
});

it("rejects empty content", async () => {
  loginAs(A);
  for (const body of [{}, { content: "   " }]) expect((await add(body)).status).toBe(400);
});

it("requires a document id to delete", async () => {
  loginAs(A);
  expect((await DELETE(req("/api/knowledge", { method: "DELETE" }))).status).toBe(400);
});

it("deletes the owner's document but not another customer's", async () => {
  loginAs(A);
  await remove("doc_b");
  expect(await ownerOf("doc_b")).toBe(B.key);
  await remove("doc_a");
  expect(await ownerOf("doc_a")).toBeUndefined();
});

it("ignores target_key and bot_id from a customer", async () => {
  loginAs(A);
  expect(await list(`?target_key=${B.key}`)).toEqual(["doc_a"]);
  expect(await list(`?bot_id=${B.bot}`)).toEqual(["doc_a"]);
  const { document } = await (await add({ content: "planted", target_key: B.key, bot_id: B.bot })).json();
  expect(await ownerOf(document.id)).toBe(A.key);
});

it("lets the admin read, write and delete any customer's documents", async () => {
  await loginAsAdmin();
  expect(await list(`?target_key=${B.key}`)).toEqual(["doc_b"]);
  expect(await list(`?bot_id=${A.bot}`)).toEqual(["doc_a"]);
  const { document } = await (await add({ content: "from admin", bot_id: B.bot })).json();
  expect(await ownerOf(document.id)).toBe(B.key);
  await remove("doc_a");
  expect(await ownerOf("doc_a")).toBeUndefined();
});
