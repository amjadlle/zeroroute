import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponseCache } from "./cache";
import type { ChatMessage, ChatResponse, ChatStreamChunk } from "./types";

const response = (content: string): ChatResponse => ({
  id: "r1",
  object: "chat.completion",
  created: 0,
  provider: "groq",
  model: "m",
  choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
});
const msgs: ChatMessage[] = [{ role: "user", content: "hi" }];

afterEach(() => {
  vi.useRealTimers();
});

describe("ResponseCache.generateKey", () => {
  const cache = new ResponseCache();

  it("is a stable hash that defaults model and temperature", () => {
    const k = cache.generateKey({ messages: msgs });
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    expect(cache.generateKey({ messages: msgs, model: "auto", temperature: 0.3 })).toBe(k);
  });

  it("changes with messages, model or temperature but not other fields", () => {
    const k = cache.generateKey({ messages: msgs });
    expect(cache.generateKey({ messages: [{ role: "user", content: "yo" }] })).not.toBe(k);
    expect(cache.generateKey({ messages: msgs, model: "x" })).not.toBe(k);
    expect(cache.generateKey({ messages: msgs, temperature: 0 })).not.toBe(k);
    expect(cache.generateKey({ messages: msgs, stream: true, max_tokens: 5 })).toBe(k);
  });
});

describe("ResponseCache get/set", () => {
  it("returns entries until their TTL passes", () => {
    vi.useFakeTimers();
    const cache = new ResponseCache();
    cache.set("a", response("x"));
    cache.set("b", response("y"), 10);
    expect(cache.get("a")?.choices[0].message.content).toBe("x");
    vi.advanceTimersByTime(11);
    expect(cache.get("b")).toBeNull();
    expect(cache.get("a")).not.toBeNull();
    vi.advanceTimersByTime(60_000);
    expect(cache.get("a")).toBeNull();
    expect(cache.get("missing")).toBeNull();
  });

  it("evicts the oldest entry once it holds more than 1000", () => {
    const cache = new ResponseCache();
    for (let i = 0; i <= 1000; i++) cache.set(`k${i}`, response(String(i)));
    expect(cache.get("k0")).not.toBeNull(); // 1001 entries: nothing evicted yet
    cache.set("k1001", response("new"));
    expect(cache.get("k0")).toBeNull();
    expect(cache.get("k1")).not.toBeNull();
    expect(cache.get("k1001")).not.toBeNull();
  });
});

describe("ResponseCache.streamCachedResponse", () => {
  it("replays the content word by word and finishes with stop", async () => {
    const chunks: ChatStreamChunk[] = [];
    for await (const c of new ResponseCache().streamCachedResponse(response("hello big world"))) chunks.push(c);
    expect(chunks.map((c) => c.choices[0].delta.content)).toEqual(["hello", " big", " world"]);
    expect(chunks.map((c) => c.choices[0].finish_reason)).toEqual([null, null, "stop"]);
    expect(chunks[0]).toMatchObject({ id: "r1", object: "chat.completion.chunk", provider: "groq", model: "m" });
  });
});
