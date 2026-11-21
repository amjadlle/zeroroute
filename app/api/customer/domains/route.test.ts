import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { A, B, loginAs, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { POST } = await import("./route");
const save = (body: unknown, bearer?: string) => POST(req("/api/customer/domains", { body, bearer }));
const stored = async (id: string) =>
  JSON.parse(String((await (await testDb()).execute({ sql: "SELECT allowed_domains FROM customers WHERE id = ?", args: [id] })).rows[0].allowed_domains));

beforeEach(seedCustomers);

it("normalises domains and saves them on the session owner only", async () => {
  loginAs(A);
  const res = await save({ domains: ["HTTPS://Shop.Example.com:8080/path?q=1"] });
  expect(await res.json()).toMatchObject({ success: true, allowedDomains: ["shop.example.com"] });
  expect(await stored(A.id)).toEqual(["shop.example.com"]);
  expect(await stored(B.id)).toEqual([]);
});

it("drops duplicates and junk before counting", async () => {
  loginAs(A);
  const res = await save({ domains: ["a.com", "https://a.com/", "", "x", null] });
  expect((await res.json()).allowedDomains).toEqual(["a.com"]);
});

it("limits a free plan to one domain and a pro plan to three", async () => {
  loginAs(A);
  expect((await save({ domains: ["a.com", "b.com"] })).status).toBe(400);
  expect(await stored(A.id)).toEqual([]);

  loginAs(B);
  expect((await save({ domains: ["a.com", "b.com", "c.com"] })).status).toBe(200);
  expect((await save({ domains: ["a.com", "b.com", "c.com", "d.com"] })).status).toBe(400);
  expect(await stored(B.id)).toEqual(["a.com", "b.com", "c.com"]);
});

it("treats a non-array domains field as clearing the list", async () => {
  loginAs(A);
  await save({ domains: ["a.com"] });
  expect((await (await save({ domains: "a.com" })).json()).allowedDomains).toEqual([]);
});

it("rejects a body that is not JSON", async () => {
  loginAs(A);
  const res = await POST(new NextRequest("http://localhost/api/customer/domains", { method: "POST", body: "{" }));
  expect(res.status).toBe(400);
});
