import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatRequest, ChatStreamChunk } from "./types";
import { extractRateLimits, getProviderApiKey, isProviderConfigured, parseSSE, providers, providerTelemetryMap, resolveSafePayload, UpstreamError } from "./providers";

const fetchMock = vi.fn();
const provider = (id: string) => providers.find((p) => p.id === id)!;
const req = (over: Partial<ChatRequest> = {}): ChatRequest => ({ messages: [{ role: "user", content: "hi" }], ...over });
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body);

/** SSE response from raw text pieces; an Error piece breaks the stream there. */
function sse(pieces: (string | Error)[], init: ResponseInit = {}) {
  const enc = new TextEncoder();
  let i = 0;
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(c) {
        if (i >= pieces.length) return c.close();
        const p = pieces[i++];
        if (p instanceof Error) c.error(p);
        else c.enqueue(enc.encode(p));
      },
    }),
    { headers: { "content-type": "text/event-stream" }, ...init },
  );
}
const data = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;

async function collect(it: AsyncIterable<ChatStreamChunk>) {
  const out: ChatStreamChunk[] = [];
  for await (const c of it) out.push(c);
  return out;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("GROQ_API_KEY", "gsk_test_key");
  vi.stubEnv("GEMINI_API_KEY", "gemini_test_key");
  vi.stubEnv("COHERE_API_KEY", "cohere_test_key");
  vi.stubEnv("OPENROUTER_API_KEY", "or_test_key");
  vi.stubEnv("CLOUDFLARE_API_TOKEN", "cf_test_token");
  vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "acct123");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  providerTelemetryMap.clear();
});
afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("API key lookup", () => {
  it("ignores placeholders and trims real keys", () => {
    vi.stubEnv("MISTRAL_API_KEY", "your-mistral-api-key");
    expect(getProviderApiKey("mistral")).toBeUndefined();
    vi.stubEnv("MISTRAL_API_KEY", "  mkey_123456 ");
    expect(getProviderApiKey("mistral")).toBe("mkey_123456");
    expect(getProviderApiKey("unknown")).toBeUndefined();
  });

  it("checks Cloudflare and Hugging Face aliases in order", () => {
    vi.stubEnv("CF_AI_API_TOKEN", "cf_primary");
    expect(getProviderApiKey("cloudflare")).toBe("cf_primary");
    vi.stubEnv("HUGGINGFACE_API_KEY", "");
    vi.stubEnv("HF_TOKEN", "hf_alias_token");
    expect(getProviderApiKey("huggingface")).toBe("hf_alias_token");
    vi.stubEnv("HF_TOKEN", "your-huggingface-api-key");
    vi.stubEnv("HUGGINGFACE_TOKEN", "");
    expect(getProviderApiKey("huggingface")).toBeUndefined();
  });

  it("needs more than 5 characters to count as configured", () => {
    vi.stubEnv("IFM_API_KEY", "12345");
    expect(isProviderConfigured("ifm")).toBe(false);
    vi.stubEnv("IFM_API_KEY", "123456");
    expect(isProviderConfigured("ifm")).toBe(true);
  });
});

describe("OpenAI-style generate (groq)", () => {
  it("posts the request with a bearer key and normalises the reply", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ id: "r1", created: 7, choices: [{ message: { content: "hello" }, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } }),
    );
    const res = await provider("groq").generate(req({ max_tokens: 50 }), undefined, "groq/override");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer gsk_test_key");
    expect(sentBody()).toEqual({ model: "groq/override", messages: req().messages, temperature: 0.3, max_tokens: 50 });
    expect(res).toMatchObject({
      id: "r1", object: "chat.completion", created: 7, provider: "groq", model: "groq/override",
      choices: [{ index: 0, message: { role: "assistant", content: "hello" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
    });
  });

  it("omits max_tokens when unset and clamps known small-context models", async () => {
    fetchMock.mockImplementation(async () => Response.json({ choices: [{ message: { content: "x" } }] }));
    await provider("groq").generate(req());
    expect(sentBody(0)).not.toHaveProperty("max_tokens");
    await provider("groq").generate(req({ max_tokens: 4000 }), undefined, "meta/llama-prompt-guard-2");
    expect(sentBody(1).max_tokens).toBe(512);
    await provider("groq").generate(req(), undefined, "qwen/qwen3.6-27b");
    expect(sentBody(2).max_tokens).toBe(900);
  });

  it("falls back to reasoning text, then to OK, when content is empty", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ choices: [{ message: { content: " ", reasoning: "thought" } }] }));
    expect((await provider("groq").generate(req())).choices[0].message.content).toBe("thought");
    fetchMock.mockResolvedValueOnce(Response.json({ choices: [] }));
    expect((await provider("groq").generate(req())).choices[0].message.content).toBe("OK");
  });

  it("captures rate-limit headers on the response and in the telemetry map", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ choices: [{ message: { content: "x" } }] }, { headers: { "x-ratelimit-remaining-requests": "29", "x-ratelimit-limit-requests": "30", "retry-after": "2" } }),
    );
    const res = await provider("groq").generate(req());
    expect(res.telemetry).toMatchObject({ remainingRequests: "29", limitRequests: "30", retryAfter: "2" });
    expect(providerTelemetryMap.get("groq")).toEqual(res.telemetry);
  });

  it.each([429, 500, 503])("throws UpstreamError with status %i and a truncated body", async (status) => {
    fetchMock.mockResolvedValueOnce(new Response("e".repeat(2000), { status }));
    const err = await provider("groq").generate(req()).catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.status).toBe(status);
    expect(err.message).toBe(`groq returned ${status}: ${"e".repeat(500)}`);
  });

  it("passes the abort signal through, so a timeout rejects the call", async () => {
    fetchMock.mockImplementationOnce(
      (_u: string, init: RequestInit) => new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason))),
    );
    const ctrl = new AbortController();
    const pending = provider("groq").generate(req(), ctrl.signal);
    ctrl.abort(new Error("timed out after 200ms"));
    await expect(pending).rejects.toThrow("timed out after 200ms");
  });

  it("refuses to call out without a key", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    await expect(provider("groq").generate(req())).rejects.toThrow("groq API key is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends OpenRouter attribution headers", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ choices: [{ message: { content: "x" } }] }));
    await provider("openrouter").generate(req());
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ "HTTP-Referer": "https://zeroroute.app", "X-Title": "ZeroRoute Gateway" });
  });
});

describe("OpenAI-style generateStream (groq)", () => {
  it("parses SSE split across chunk boundaries and skips [DONE] and junk lines", async () => {
    fetchMock.mockResolvedValueOnce(
      sse([
        data({ id: "s1", choices: [{ delta: { content: "Hel" } }] }).slice(0, 20),
        data({ id: "s1", choices: [{ delta: { content: "Hel" } }] }).slice(20),
        ": keep-alive comment\n\n",
        "data: {not json}\n\n",
        data({ id: "s1", choices: [{ delta: { content: "lo", reasoning: "r" }, finish_reason: "stop" }] }),
        "data: [DONE]\n\n",
      ], { headers: { "x-ratelimit-remaining": "4" } }),
    );
    const chunks = await collect(provider("groq").generateStream(req({ stream: true })));
    expect(chunks.map((c) => c.choices[0].delta.content)).toEqual(["Hel", "lo"]);
    expect(chunks[1].choices[0]).toMatchObject({ delta: { reasoning: "r" }, finish_reason: "stop" });
    expect(chunks[0]).toMatchObject({ id: "s1", object: "chat.completion.chunk", provider: "groq" });
    expect(sentBody().stream).toBe(true);
    expect(providerTelemetryMap.get("groq")).toMatchObject({ remainingRequests: "4" });
  });

  it("yields a final event that has no trailing newline", async () => {
    fetchMock.mockResolvedValueOnce(sse([`data: ${JSON.stringify({ choices: [{ delta: { content: "end" } }] })}`]));
    const chunks = await collect(provider("groq").generateStream(req()));
    expect(chunks.map((c) => c.choices[0].delta.content)).toEqual(["end"]);
  });

  it("throws UpstreamError before yielding on a non-2xx reply", async () => {
    fetchMock.mockResolvedValueOnce(new Response("slow down", { status: 429 }));
    const err = await collect(provider("groq").generateStream(req())).catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.status).toBe(429);
  });

  it("surfaces a mid-stream failure to the caller after the chunks already sent", async () => {
    fetchMock.mockResolvedValueOnce(sse([data({ choices: [{ delta: { content: "Hel" } }] }), new Error("socket reset")]));
    const seen: string[] = [];
    const err = await (async () => {
      for await (const c of provider("groq").generateStream(req())) seen.push(c.choices[0].delta.content!);
    })().catch((e) => e);
    expect(seen).toEqual(["Hel"]);
    expect(err).toEqual(new Error("socket reset"));
  });
});

describe("Gemini adapter", () => {
  it("maps system and assistant roles and sends the key in a header, not the URL", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ candidates: [{ content: { parts: [{ text: "a" }, { text: "b" }] } }], usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 1, totalTokenCount: 5 } }),
    );
    const res = await provider("gemini").generate({
      messages: [{ role: "system", content: "be brief" }, { role: "user", content: "q" }, { role: "assistant", content: "a" }],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent");
    expect(url).not.toContain("gemini_test_key");
    expect(init.headers["x-goog-api-key"]).toBe("gemini_test_key");
    expect(sentBody()).toMatchObject({
      systemInstruction: { parts: [{ text: "be brief" }] },
      contents: [{ role: "user", parts: [{ text: "q" }] }, { role: "model", parts: [{ text: "a" }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });
    expect(res.choices[0].message.content).toBe("a");
    expect(res.usage).toEqual({ prompt_tokens: 4, completion_tokens: 1, total_tokens: 5 });
  });

  it("reports a blocked reply by its finish reason", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ candidates: [{ finishReason: "SAFETY" }] }));
    expect((await provider("gemini").generate(req())).choices[0].message.content).toBe("[SAFETY]");
  });

  it("streams candidates and marks the finish", async () => {
    fetchMock.mockResolvedValueOnce(
      sse([data({ candidates: [{ content: { parts: [{ text: "x" }] } }] }), data({ candidates: [{ content: { parts: [{ text: "y" }] }, finishReason: "STOP" }] })]),
    );
    const chunks = await collect(provider("gemini").generateStream(req()));
    expect(chunks.map((c) => [c.choices[0].delta.content, c.choices[0].finish_reason])).toEqual([["x", null], ["y", "stop"]]);
    expect(fetchMock.mock.calls[0][0]).toContain(":streamGenerateContent?alt=sse");
  });
});

describe("Cohere and Cloudflare adapters", () => {
  it("maps Cohere v2 replies and streams them as one chunk", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: { content: [{ text: "hey" }] }, usage: { tokens: { input_tokens: 2, output_tokens: 1 } } }));
    const res = await provider("cohere").generate(req());
    expect(res.usage).toEqual({ prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 });
    fetchMock.mockResolvedValueOnce(Response.json({ message: { content: [{ text: "hey" }] } }));
    const chunks = await collect(provider("cohere").generateStream(req()));
    expect(chunks).toHaveLength(1);
    expect(chunks[0].choices[0]).toMatchObject({ delta: { role: "assistant", content: "hey" }, finish_reason: "stop" });
  });

  it("needs a Cloudflare account id and puts the model in the URL", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ result: { response: "cf" } }));
    expect((await provider("cloudflare").generate(req())).choices[0].message.content).toBe("cf");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.cloudflare.com/client/v4/accounts/acct123/ai/run/@cf/meta/llama-3.1-8b-instruct");
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "");
    await expect(provider("cloudflare").generate(req())).rejects.toThrow("cloudflare credentials are not configured");
  });
});

describe("extractRateLimits", () => {
  it("reads the alternative header spellings and returns undefined when none are present", () => {
    const h = new Response(null, { headers: { "ratelimit-remaining": "1", "ratelimit-limit": "2", "x-ratelimit-remaining-tpm": "3", "ratelimit-reset": "4" } });
    expect(extractRateLimits(h)).toEqual({
      remainingRequests: "1", limitRequests: "2", remainingTokens: "3", limitTokens: undefined,
      resetRequests: "4", resetTokens: undefined, retryAfter: undefined,
    });
    expect(extractRateLimits(new Response(null))).toBeUndefined();
    expect(extractRateLimits(undefined)).toBeUndefined();
  });
});

describe("parseSSE (#38)", () => {
  async function lines(pieces: string[]) {
    const out: string[] = [];
    for await (const d of parseSSE(sse(pieces).body!)) out.push(d);
    return out;
  }

  it("yields data payloads split across chunks and skips [DONE], comments and blanks", async () => {
    expect(await lines(["data: {\"a\"", ":1}\n\n: ping\n", "event: x\ndata:\n", "data: [DONE]\n\n"])).toEqual(['{"a":1}']);
  });

  it("flushes a final line with no trailing newline", async () => {
    expect(await lines(["data: one\n", "data: two"])).toEqual(["one", "two"]);
  });
});

describe("resolveSafePayload (#38)", () => {
  it("builds the payload with default temperature and optional fields", () => {
    expect(resolveSafePayload("m", req())).toEqual({ model: "m", messages: req().messages, temperature: 0.3 });
    expect(resolveSafePayload("m", req({ max_tokens: 50, temperature: 0 }), true)).toMatchObject({ max_tokens: 50, temperature: 0, stream: true });
  });

  it("caps max_tokens for models with small output limits", () => {
    expect(resolveSafePayload("llama-prompt-guard-2", req()).max_tokens).toBe(512);
    expect(resolveSafePayload("llama-prompt-guard-2", req({ max_tokens: 100 })).max_tokens).toBe(100);
    expect(resolveSafePayload("qwen3.6-27b", req({ max_tokens: 2000 })).max_tokens).toBe(900);
    expect(resolveSafePayload("qwen3.6-27b", req({ max_tokens: 100 })).max_tokens).toBe(100);
  });
});
