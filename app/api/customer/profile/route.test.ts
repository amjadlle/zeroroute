import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, loginAsAdmin, req, seedCustomers } from "@/tests/auth";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET } = await import("./route");
const profile = async (bearer?: string) => (await (await GET(req("/api/customer/profile", { bearer }))).json()).customer;

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, created_at) VALUES
    ('d1', '${A.key}', 't', 'manual_text', 'a doc', 5, 0),
    ('d2', '${B.key}', 't', 'manual_text', 'b doc', 5, 0),
    ('d3', '${B.key}', 't', 'manual_text', 'b doc', 5, 0)`);
});

it("returns only the session owner's profile and document count", async () => {
  loginAs(A);
  expect(await profile()).toMatchObject({ id: A.id, key: A.key, email: A.email, knowledge_docs_count: 1, is_admin: false });
});

it("uses the cookie session over a bearer key for another customer", async () => {
  loginAs(A);
  expect(await profile(B.key)).toMatchObject({ id: A.id, knowledge_docs_count: 1 });
});

it("accepts the customer's API key as a bearer token", async () => {
  expect(await profile(B.key)).toMatchObject({ id: B.id, knowledge_docs_count: 2, monthly_limit: 10000 });
});

it("never returns password or session material", async () => {
  loginAs(A);
  const c = await profile();
  expect(c).not.toHaveProperty("password_hash");
  expect(c).not.toHaveProperty("password_salt");
  expect(c).not.toHaveProperty("session_token");
});

it("flags the admin session", async () => {
  await loginAsAdmin();
  expect(await profile()).toMatchObject({ id: "admin_master", is_admin: true });
});
