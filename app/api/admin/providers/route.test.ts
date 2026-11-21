import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { loginAsAdmin, req, seedCustomers } from "@/tests/auth";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET, PUT } = await import("./route");
const { POST: test } = await import("./test/route");

beforeAll(() => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network disabled in tests"); })));
afterAll(() => vi.unstubAllGlobals());

beforeEach(async () => {
  await seedCustomers();
  await loginAsAdmin();
});

it("rejects a payload without a providers array", async () => {
  for (const body of [{}, { providers: "groq" }]) {
    expect((await PUT(req("/api/admin/providers", { method: "PUT", body }))).status).toBe(400);
  }
});

it("saves enable, order and model changes and ignores unknown providers", async () => {
  const before = (await (await GET(req("/api/admin/providers"))).json()).providers;
  const target = before[0];
  const res = await PUT(req("/api/admin/providers", {
    method: "PUT",
    body: { providers: [{ id: target.id, enabled: false, order: 7, models: [" custom-model ", ""] }, { id: "no_such_provider", enabled: true }] },
  }));
  const after = (await res.json()).providers;
  expect(after.find((p: { id: string }) => p.id === target.id)).toMatchObject({ enabled: false, order: 7, model: "custom-model", models: ["custom-model"] });
  expect(after.find((p: { id: string }) => p.id === "no_such_provider")).toBeUndefined();
});

it("returns 404 when testing an unknown provider", async () => {
  expect((await test(req("/api/admin/providers/test", { body: { providerId: "no_such_provider" } }))).status).toBe(404);
});

it("explains, without calling the provider, that an embedding model can't chat", async () => {
  const { providers } = await (await GET(req("/api/admin/providers"))).json();
  const res = await test(req("/api/admin/providers/test", { body: { providerId: providers[0].id, model: "bge-small-embed" } }));
  expect(await res.json()).toMatchObject({ ok: false, error: expect.stringMatching(/embedding/i) });
  expect(fetch).not.toHaveBeenCalled();
});
