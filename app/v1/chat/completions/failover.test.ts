// Provider failover order through the real gateway route, with every provider fetch mocked.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { testDb } from "@/tests/db";
import { runtimeStateMap } from "@/lib/providers/state";

vi.hoisted(() => {
  process.env.TIMEOUT_MS = "150"; // read by lib/providers/state at import
  process.env.COOLDOWN_MS = "60000";
});
vi.mock("@/lib/auth/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/session")>()),
  getCurrentUser: async () => null,
}));

const { POST } = await import("./route");

const HOSTS: Record<string, string> = { "api.groq.com": "groq", "api.mistral.ai": "mistral", "api.cerebras.ai": "cerebras" };
type Behaviour = "ok" | "hang" | number | ((signal: AbortSignal) => Response);
let behaviour: Record<string, Behaviour[]> = {};
const fetchMock = vi.fn();
const calls = () => fetchMock.mock.calls.map(([url, init]) => `${HOSTS[new URL(url).host]}:${JSON.parse(init.body).model}`);

let key = "";
let seq = 0;
function chat(body: Record<string, unknown> = {}) {
  return POST(new Request("http://localhost/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ messages: [{ role: "user", content: `question ${++seq}` }], ...body }), // unique: no cache hits
  }));
}

function sseOk(text: string) {
  return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`, {
    headers: { "content-type": "text/event-stream" },
  });
}

beforeAll(async () => {
  const db = await testDb();
  key = "zr_live_failover";
  await db.execute(
    `INSERT INTO customers (id, key, email, status, monthly_requests, monthly_limit, created_at, updated_at)
     VALUES ('c_fo', '${key}', 'fo@test.dev', 'active', 0, 100000, 0, 0)`,
  );
  vi.stubEnv("GROQ_API_KEY", "gsk_test_key");
  vi.stubEnv("MISTRAL_API_KEY", "mistral_test_key");
  vi.stubEnv("CEREBRAS_API_KEY", "cerebras_test_key");
});
afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  const order = ["groq", "mistral", "cerebras"];
  for (const s of runtimeStateMap.values()) {
    s.enabled = order.includes(s.id);
    s.order = order.indexOf(s.id) + 1;
    s.cooldownUntil = 0;
    s.consecutiveFailures = 0;
    s.lastError = undefined;
  }
  runtimeStateMap.get("groq")!.models = ["g1", "g2"];
  runtimeStateMap.get("mistral")!.models = ["m1"];
  runtimeStateMap.get("cerebras")!.models = ["c1"];
  behaviour = {};
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const id = HOSTS[new URL(url).host];
    const b = behaviour[id]?.shift() ?? "ok";
    if (typeof b === "function") return b(init.signal!);
    if (b === "hang") {
      return new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)));
    }
    if (typeof b === "number") return new Response(`${id} error`, { status: b });
    const model = JSON.parse(init.body as string).model;
    return JSON.parse(init.body as string).stream ? sseOk(`${id}:${model}`) : Response.json({ choices: [{ message: { content: `${id}:${model}` } }] });
  });
  vi.stubGlobal("fetch", fetchMock);
});

const content = async (res: Response) => (await res.json()).choices[0].message.content;

describe("non-streaming failover", () => {
  it("uses the first provider's first model when it works", async () => {
    const res = await chat();
    expect(await content(res)).toBe("groq:g1");
    expect(calls()).toEqual(["groq:g1"]);
  });

  it("tries the next model, then the next provider, on 429 / 5xx", async () => {
    behaviour = { groq: [429, 503] };
    const res = await chat();
    expect(res.status).toBe(200);
    expect(await content(res)).toBe("mistral:m1");
    expect(calls()).toEqual(["groq:g1", "groq:g2", "mistral:m1"]);
  });

  it("puts a provider whose every model failed into cooldown, and skips it next time", async () => {
    behaviour = { groq: [500, 500] };
    const before = Date.now();
    await chat();
    const groq = runtimeStateMap.get("groq")!;
    expect(groq.consecutiveFailures).toBe(1);
    expect(groq.cooldownUntil).toBeGreaterThanOrEqual(before + 60_000);
    expect(groq.lastError).toMatch(/groq returned 500/);

    fetchMock.mockClear();
    expect(await content(await chat())).toBe("mistral:m1");
    expect(calls()).toEqual(["mistral:m1"]);
  });

  it("clears the failure count on the next success", async () => {
    runtimeStateMap.get("groq")!.consecutiveFailures = 3;
    await chat();
    expect(runtimeStateMap.get("groq")!).toMatchObject({ consecutiveFailures: 0, cooldownUntil: 0 });
  });

  it("does not cool down a provider when only its first model failed", async () => {
    behaviour = { groq: [500] };
    expect(await content(await chat())).toBe("groq:g2");
    expect(runtimeStateMap.get("groq")!.cooldownUntil).toBe(0);
  });

  it("fails over when a provider times out", async () => {
    behaviour = { groq: ["hang", "hang"] };
    const res = await chat();
    expect(await content(res)).toBe("mistral:m1");
    expect(runtimeStateMap.get("groq")!.lastError).toMatch(/timeout|aborted/i);
  });

  it("starts with the requested model's provider and model", async () => {
    expect(await content(await chat({ model: "g2" }))).toBe("groq:g2");
    fetchMock.mockClear();
    expect(await content(await chat({ model: "c1" }))).toBe("cerebras:c1");
    expect(calls()).toEqual(["cerebras:c1"]);
  });

  it("returns 502 with every failure listed once all providers fail", async () => {
    behaviour = { groq: [500, 500], mistral: [429], cerebras: [503] };
    const res = await chat();
    expect(res.status).toBe(502);
    const { error } = await res.json();
    expect(error.details).toHaveLength(4);
    expect(error.details[0]).toMatch(/^groq\/g1: groq returned 500/);
    expect(calls()).toEqual(["groq:g1", "groq:g2", "mistral:m1", "cerebras:c1"]);
  });
});

describe("streaming failover", () => {
  it("fails over before the first chunk on 429 / 5xx", async () => {
    behaviour = { groq: [429, 500] };
    const res = await chat({ stream: true });
    const text = await res.text();
    expect(text).toContain('"mistral:m1"');
    expect(text).toContain("data: [DONE]");
    expect(calls()).toEqual(["groq:g1", "groq:g2", "mistral:m1"]);
    expect(runtimeStateMap.get("groq")!.consecutiveFailures).toBe(1);
  });

  it("fails over on an empty stream", async () => {
    behaviour = { groq: [() => new Response("", { headers: { "content-type": "text/event-stream" } }), 500] };
    const text = await (await chat({ stream: true })).text();
    expect(text).toContain('"mistral:m1"');
  });

  it("does not switch provider once chunks have been sent", async () => {
    const enc = new TextEncoder();
    behaviour = {
      groq: [() => new Response(new ReadableStream({
        start(c) {
          c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "partial" } }] })}\n\n`));
          setTimeout(() => c.error(new Error("socket reset")), 10);
        },
      }), { headers: { "content-type": "text/event-stream" } })],
    };
    const text = await (await chat({ stream: true })).text();
    expect(text).toContain('"partial"');
    expect(text).toContain('"stream_error"');
    expect(calls()).toEqual(["groq:g1"]);
  });
});
