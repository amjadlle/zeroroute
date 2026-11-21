import { beforeEach, expect, it, vi } from "vitest";
import { B, req, seedCustomers } from "@/tests/auth";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET: profile } = await import("./profile/route");
const { GET: stats } = await import("./stats/route");
const { POST: domains } = await import("./domains/route");
const { POST: regenerate } = await import("./key/regenerate/route");
const { POST: persona } = await import("./persona/route");

beforeEach(seedCustomers);

const calls = {
  profile: (bearer?: string) => profile(req("/api/customer/profile", { bearer })),
  stats: () => stats(),
  domains: (bearer?: string) => domains(req("/api/customer/domains", { bearer, body: { domains: ["x.com"] } })),
  regenerate: (bearer?: string) => regenerate(req("/api/customer/key/regenerate", { bearer, method: "POST" })),
  persona: (bearer?: string) => persona(req("/api/customer/persona", { bearer, body: { greeting: "hijack" } })),
};

it.each(Object.entries(calls))("%s rejects a request with no session or key", async (_name, call) => {
  expect((await call()).status).toBe(401);
});

// Bearer lookups match API keys only: a customer id, bot id or session token must not authenticate.
it.each(Object.entries(calls).filter(([n]) => n !== "stats"))("%s rejects a non-key bearer token", async (_name, call) => {
  for (const token of [B.id, B.bot, B.session, "zr_live_unknown"]) {
    expect((await call(token)).status).toBe(401);
  }
});
