import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";
import { verifyPassword } from "@/lib/auth/password";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { POST } = await import("./route");
const setup = (body: unknown, bearer?: string) => POST(req("/api/onboarding/setup", { body, bearer }));
const row = async (id: string) => (await (await testDb()).execute({ sql: "SELECT * FROM customers WHERE id = ?", args: [id] })).rows[0];
const docs = async () =>
  (await (await testDb()).execute("SELECT customer_key, title, content FROM knowledge_documents")).rows.map((r) => ({ ...r }));

beforeEach(seedCustomers);

it("rejects a request with no session or key, or a demo token", async () => {
  expect((await setup({ name: "x" })).status).toBe(401);
  expect((await setup({ token: "zr_live_demo" })).status).toBe(401);
  expect((await setup({ key: B.id })).status).toBe(401);
});

it("saves the session owner's setup, password and first knowledge, and keeps them signed in", async () => {
  loginAs(A);
  const res = await setup({
    name: "Ann",
    company: "Ann Co",
    botTitle: "x".repeat(300),
    prompts: Array.from({ length: 12 }, (_, i) => `q${i}`),
    password: "onboard-pass",
    knowledgeText: "  We open at nine every weekday.  ",
  });
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.token).toBe(A.session);
  expect(res.cookies.get("zr_session")?.value).toBe(A.session);

  const saved = await row(A.id);
  expect(saved).toMatchObject({ name: "Ann", company: "Ann Co", session_token: A.session });
  expect(String(saved.bot_title)).toHaveLength(100);
  expect(JSON.parse(String(saved.prompts))).toHaveLength(10);
  expect(verifyPassword("onboard-pass", String(saved.password_hash), String(saved.password_salt))).toBe(true);
  expect(await docs()).toEqual([{ customer_key: A.key, title: "Initial Onboarding Knowledge", content: "We open at nine every weekday." }]);

  expect((await row(B.id)).name).toBeNull();
});

it("lets an API key update its own profile without issuing a session", async () => {
  const res = await setup({ company: "B Co", knowledgeText: "short" }, B.key);
  expect(res.status).toBe(200);
  expect((await res.json()).token).toBeUndefined();
  expect(res.cookies.get("zr_session")).toBeUndefined();
  expect((await row(B.id)).company).toBe("B Co");
  expect((await row(A.id)).company).toBeNull();
  expect(await docs()).toEqual([]); // 10 characters or fewer is not saved
});

it("prefers the cookie session over a key for another customer", async () => {
  loginAs(A);
  await setup({ company: "Hijack" }, B.key);
  expect((await row(A.id)).company).toBe("Hijack");
  expect((await row(B.id)).company).toBeNull();
});

it("rejects a too-short password instead of ignoring it", async () => {
  loginAs(A);
  expect((await setup({ password: "123" })).status).toBe(400);
});

const domains = async (id: string) => JSON.parse(String((await row(id)).allowed_domains));

it("adds the website to allowed domains, cleaned the same way as the Install page", async () => {
  loginAs(A);
  expect((await setup({ company: "Ann Co", website: "https://Shop.Example.com/about" })).status).toBe(200);
  expect(await domains(A.id)).toEqual(["shop.example.com"]);
  // Saving again does not duplicate it.
  await setup({ company: "Ann Co", website: "shop.example.com" });
  expect(await domains(A.id)).toEqual(["shop.example.com"]);
});

it("leaves allowed domains alone when the website would go over the plan's limit", async () => {
  loginAs(A); // free plan: one domain
  await (await testDb()).execute({ sql: "UPDATE customers SET allowed_domains = ? WHERE id = ?", args: ['["first.example"]', A.id] });
  expect((await setup({ company: "Ann Co", website: "second.example" })).status).toBe(200);
  expect(await domains(A.id)).toEqual(["first.example"]);
  expect((await row(A.id)).website).toBe("second.example");
});
