import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { providers, providerTelemetryMap } from "./providers";
import {
  DEFAULT_PROVIDER_MODELS, getEligibleProviders, getRuntimeProviders, runtimeStateMap, updateProviderTelemetry,
} from "./state";

const KEYS = { GROQ_API_KEY: "gsk_test_key", MISTRAL_API_KEY: "mistral_test_key", GEMINI_API_KEY: "gemini_test_key" };
const ids = (list: { provider: { id: string } }[]) => list.map((x) => x.provider.id);

beforeEach(() => {
  vi.unstubAllEnvs();
  for (const name of Object.keys(process.env)) {
    if (/_API_KEY$|_API_TOKEN$|^HF_TOKEN$|^HUGGINGFACE_TOKEN$/.test(name)) vi.stubEnv(name, "");
  }
  for (const [k, v] of Object.entries(KEYS)) vi.stubEnv(k, v);
  // Fixed order: groq, mistral, gemini, then everything else.
  const first = ["groq", "mistral", "gemini"];
  for (const s of runtimeStateMap.values()) {
    const i = first.indexOf(s.id);
    s.order = i === -1 ? 10 + s.order : i + 1;
    s.enabled = true;
    s.cooldownUntil = 0;
    s.consecutiveFailures = 0;
    s.models = [...(DEFAULT_PROVIDER_MODELS[s.id] ?? [s.model])];
  }
  providerTelemetryMap.clear();
});
afterAll(() => vi.unstubAllEnvs());

describe("initial runtime state", () => {
  it("has one entry per provider, with the first default model as primary", () => {
    expect([...runtimeStateMap.keys()].sort()).toEqual(providers.map((p) => p.id).sort());
    for (const s of runtimeStateMap.values()) {
      expect(s.models.length).toBeGreaterThan(0);
      expect(s.model).toBe(DEFAULT_PROVIDER_MODELS[s.id]?.[0] ?? providers.find((p) => p.id === s.id)!.model);
    }
  });
});

describe("getEligibleProviders", () => {
  it("returns only enabled providers that have an API key, in order", () => {
    expect(ids(getEligibleProviders())).toEqual(["groq", "mistral", "gemini"]);
    runtimeStateMap.get("mistral")!.enabled = false;
    expect(ids(getEligibleProviders())).toEqual(["groq", "gemini"]);
  });

  it("treats placeholder or too-short keys as unconfigured", () => {
    vi.stubEnv("GROQ_API_KEY", "your-groq-api-key");
    vi.stubEnv("GEMINI_API_KEY", "abc");
    expect(ids(getEligibleProviders())).toEqual(["mistral"]);
  });

  it("re-reads configuration on every call", () => {
    vi.stubEnv("COHERE_API_KEY", "cohere_test_key");
    expect(ids(getEligibleProviders())).toContain("cohere");
    vi.stubEnv("COHERE_API_KEY", "");
    expect(ids(getEligibleProviders())).not.toContain("cohere");
  });

  it("moves cooling providers to the back, soonest-ready first", () => {
    const now = Date.now();
    runtimeStateMap.get("groq")!.cooldownUntil = now + 60_000;
    runtimeStateMap.get("mistral")!.cooldownUntil = now + 5_000;
    expect(ids(getEligibleProviders())).toEqual(["gemini", "mistral", "groq"]);
  });

  it("puts a provider back in line once its cooldown has passed", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      runtimeStateMap.get("groq")!.cooldownUntil = Date.now() + 1000;
      expect(ids(getEligibleProviders())[0]).toBe("mistral");
      vi.advanceTimersByTime(1000); // cooldownUntil <= now counts as ready
      expect(ids(getEligibleProviders())[0]).toBe("groq");
    } finally {
      vi.useRealTimers();
    }
  });

  it("moves a requested provider id, primary model or listed model (any case) to the front", () => {
    expect(ids(getEligibleProviders("gemini"))).toEqual(["gemini", "groq", "mistral"]);
    expect(ids(getEligibleProviders(providers.find((p) => p.id === "mistral")!.model.toUpperCase()))[0]).toBe("mistral");
    runtimeStateMap.get("gemini")!.models = ["gemini-3.5-flash", "Custom-Model-X"];
    expect(ids(getEligibleProviders("custom-model-x"))[0]).toBe("gemini");
  });

  it("prefers a requested provider even when it is cooling down", () => {
    runtimeStateMap.get("gemini")!.cooldownUntil = Date.now() + 60_000;
    expect(ids(getEligibleProviders("gemini"))).toEqual(["gemini", "groq", "mistral"]);
  });

  it("ignores auto, default, unknown and unconfigured targets", () => {
    for (const t of ["auto", "default", "no-such-model", "cohere"]) {
      expect(ids(getEligibleProviders(t))).toEqual(["groq", "mistral", "gemini"]);
    }
  });

  it("returns an empty list when nothing is configured", () => {
    for (const k of Object.keys(KEYS)) vi.stubEnv(k, "");
    expect(getEligibleProviders()).toEqual([]);
  });
});

describe("updateProviderTelemetry", () => {
  it("merges rate-limit telemetry and records latency and last use", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(5_000);
      updateProviderTelemetry("groq", { remainingRequests: "10", limitRequests: "30" }, 120);
      updateProviderTelemetry("groq", { remainingRequests: "9" });
      const s = runtimeStateMap.get("groq")!;
      expect(s.rateLimits).toMatchObject({ remainingRequests: "9", limitRequests: "30" });
      expect(s.lastLatencyMs).toBe(120);
      expect(s.lastUsedAt).toBe(5_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores empty telemetry and non-positive latency", () => {
    const s = runtimeStateMap.get("mistral")!;
    s.rateLimits = undefined;
    s.lastLatencyMs = 50;
    updateProviderTelemetry("mistral", {}, 0);
    updateProviderTelemetry("mistral", undefined, -1);
    expect(s.rateLimits).toBeUndefined();
    expect(s.lastLatencyMs).toBe(50);
  });

  it("is a no-op for an unknown provider", () => {
    expect(() => updateProviderTelemetry("nope", { retryAfter: "1" }, 10)).not.toThrow();
    expect(runtimeStateMap.has("nope")).toBe(false);
  });

  it("does not touch failure counters or cooldown (the gateway route owns those)", () => {
    const s = runtimeStateMap.get("groq")!;
    s.consecutiveFailures = 2;
    s.cooldownUntil = 123;
    updateProviderTelemetry("groq", { retryAfter: "30" }, 10);
    expect(s).toMatchObject({ consecutiveFailures: 2, cooldownUntil: 123 });
  });
});

describe("getRuntimeProviders", () => {
  it("is sorted by order and picks up telemetry captured from responses", () => {
    providerTelemetryMap.set("gemini", { remainingTokens: "500" });
    const list = getRuntimeProviders();
    expect(list.map((p) => p.order)).toEqual([...list.map((p) => p.order)].sort((a, b) => a - b));
    expect(list.find((p) => p.id === "gemini")!.rateLimits).toEqual({ remainingTokens: "500" });
  });
});
