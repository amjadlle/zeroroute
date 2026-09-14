/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ChatRequest, ChatResponse, ChatStreamChunk, Provider, RateLimitTelemetry } from "./types";

const ENV_MAP: Record<string, string> = {
  groq: "GROQ_API_KEY",
  sambanova: "SAMBANOVA_API_KEY",
  mistral: "MISTRAL_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  nvidia: "NVIDIA_API_KEY",
  huggingface: "HUGGINGFACE_API_KEY",
  bazaarlink: "BAZAARLINK_API_KEY",
  cloudflare: "CLOUDFLARE_API_TOKEN",
  cerebras: "CEREBRAS_API_KEY",
  cohere: "COHERE_API_KEY"
};

export function getProviderApiKey(providerId: string): string | undefined {
  if (providerId === "cloudflare") {
    const cfToken = process.env.CF_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;
    if (cfToken && cfToken !== "your-cloudflare-api-token") {
      return cfToken.trim();
    }
  } else if (providerId === "huggingface") {
    const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
    if (hfToken && hfToken !== "your-huggingface-api-key") {
      return hfToken.trim();
    }
  } else {
    const envVar = ENV_MAP[providerId];
    if (envVar && process.env[envVar] && process.env[envVar] !== `your-${providerId}-api-key`) {
      return process.env[envVar]?.trim();
    }
  }
  return undefined;
}

export function isProviderConfigured(providerId: string): boolean {
  const key = getProviderApiKey(providerId);
  return Boolean(key && key.length > 5);
}

const parseJsonOrError = async (response: Response, name: string) => {
  if (!response.ok) {
    const errorText = (await response.text()).slice(0, 500);
    throw new Error(`${name} returned ${response.status}: ${errorText}`);
  }
  return response.json() as Promise<any>;
};

async function* parseSSE(stream: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const data = trimmed.slice(5).trim();
          if (data && data !== "[DONE]") {
            yield data;
          }
        }
      }
    }
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data:")) {
        const data = trimmed.slice(5).trim();
        if (data && data !== "[DONE]") {
          yield data;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

const resolveSafePayload = (model: string, request: ChatRequest, stream = false) => {
  let maxTokens = request.max_tokens;
  if (model.includes("prompt-guard")) {
    maxTokens = Math.min(maxTokens || 512, 512);
  } else if (model.includes("qwen3.6-27b") && (!maxTokens || maxTokens > 900)) {
    maxTokens = 900;
  }

  const payload: any = {
    model,
    messages: request.messages,
    temperature: request.temperature ?? 0.3
  };
  if (maxTokens !== undefined) {
    payload.max_tokens = maxTokens;
  }
  if (stream) {
    payload.stream = true;
  }
  return payload;
};

const openAIStyle = (
  id: string,
  url: string,
  key: string | undefined,
  model: string,
  request: ChatRequest,
  signal?: AbortSignal,
  extraHeaders?: Record<string, string>
) => {
  if (!key) throw new Error(`${id} API key is not configured`);
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(extraHeaders || {})
    },
    body: JSON.stringify(resolveSafePayload(model, request, false)),
    signal
  });
};

async function* openAIStyleStream(
  id: string,
  url: string,
  key: string | undefined,
  model: string,
  request: ChatRequest,
  signal?: AbortSignal,
  extraHeaders?: Record<string, string>
): AsyncIterable<ChatStreamChunk> {
  if (!key) throw new Error(`${id} API key is not configured`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(extraHeaders || {})
    },
    body: JSON.stringify(resolveSafePayload(model, request, true)),
    signal
  });

  if (!res.ok) {
    const errorText = (await res.text()).slice(0, 500);
    throw new Error(`${id} returned ${res.status}: ${errorText}`);
  }
  if (!res.body) throw new Error(`${id} returned no response stream`);

  for await (const line of parseSSE(res.body)) {
    try {
      const data = JSON.parse(line);
      const content = data.choices?.[0]?.delta?.content ?? "";
      const finish_reason = data.choices?.[0]?.finish_reason ?? null;
      yield {
        id: data.id ?? `${id}-${Date.now()}`,
        object: "chat.completion.chunk",
        created: data.created ?? Math.floor(Date.now() / 1000),
        provider: id,
        model,
        choices: [
          {
            index: 0,
            delta: { content },
            finish_reason
          }
        ]
      };
    } catch {
      // ignore JSON parse errors in malformed chunks
    }
  }
}

export const extractRateLimits = (res?: Response): RateLimitTelemetry | undefined => {
  if (!res || !res.headers) return undefined;
  const h = res.headers;
  const remainingReq = h.get("x-ratelimit-remaining-requests") || h.get("x-ratelimit-remaining") || h.get("ratelimit-remaining");
  const limitReq = h.get("x-ratelimit-limit-requests") || h.get("x-ratelimit-limit") || h.get("ratelimit-limit");
  const remainingTok = h.get("x-ratelimit-remaining-tokens") || h.get("x-ratelimit-remaining-tpm");
  const limitTok = h.get("x-ratelimit-limit-tokens") || h.get("x-ratelimit-limit-tpm");
  const resetReq = h.get("x-ratelimit-reset-requests") || h.get("x-ratelimit-reset") || h.get("ratelimit-reset");
  const resetTok = h.get("x-ratelimit-reset-tokens");
  const retryAfter = h.get("retry-after");

  if (remainingReq || limitReq || remainingTok || limitTok || resetReq || retryAfter) {
    return {
      remainingRequests: remainingReq || undefined,
      limitRequests: limitReq || undefined,
      remainingTokens: remainingTok || undefined,
      limitTokens: limitTok || undefined,
      resetRequests: resetReq || undefined,
      resetTokens: resetTok || undefined,
      retryAfter: retryAfter || undefined
    };
  }
  return undefined;
};

const normalize = (id: string, model: string, data: any, res?: Response): ChatResponse => {
  let content = data.choices?.[0]?.message?.content;
  if (!content || (typeof content === "string" && !content.trim())) {
    content = data.choices?.[0]?.message?.reasoning || data.choices?.[0]?.message?.reasoning_content || data.choices?.[0]?.delta?.content || data.choices?.[0]?.text;
  }
  if (typeof content !== "string" || !content.trim()) {
    content = "OK";
  }
  const telemetry = extractRateLimits(res);
  return {
    id: data.id ?? `${id}-${Date.now()}`,
    object: "chat.completion",
    created: data.created ?? Math.floor(Date.now() / 1000),
    provider: id,
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: data.choices?.[0]?.finish_reason ?? "stop"
      }
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens || 0,
          completion_tokens: data.usage.completion_tokens || 0,
          total_tokens: data.usage.total_tokens || 0
        }
      : undefined,
    telemetry
  };
};

async function* fallbackStreamFromGenerate(
  provider: { generate: (r: ChatRequest, s?: AbortSignal, m?: string) => Promise<ChatResponse> },
  request: ChatRequest,
  signal?: AbortSignal,
  modelOverride?: string
): AsyncIterable<ChatStreamChunk> {
  const resp = await provider.generate(request, signal, modelOverride);
  const content = resp.choices[0].message.content;
  yield {
    id: resp.id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    provider: resp.provider,
    model: resp.model,
    choices: [
      {
        index: 0,
        delta: { role: "assistant", content },
        finish_reason: "stop"
      }
    ]
  };
}

export const providers: Provider[] = [
  {
    id: "mistral",
    name: "Mistral AI",
    model: process.env.MISTRAL_MODEL ?? "open-mistral-nemo",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("mistral");
      const res = await openAIStyle("mistral", "https://api.mistral.ai/v1/chat/completions", key, targetModel, r, s);
      return normalize("mistral", targetModel, await parseJsonOrError(res, "mistral"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("mistral");
      return openAIStyleStream("mistral", "https://api.mistral.ai/v1/chat/completions", key, targetModel, r, s);
    }
  },
  {
    id: "groq",
    name: "Groq",
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("groq");
      const res = await openAIStyle("groq", "https://api.groq.com/openai/v1/chat/completions", key, targetModel, r, s);
      return normalize("groq", targetModel, await parseJsonOrError(res, "groq"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("groq");
      return openAIStyleStream("groq", "https://api.groq.com/openai/v1/chat/completions", key, targetModel, r, s);
    }
  },
  {
    id: "cerebras",
    name: "Cerebras",
    model: process.env.CEREBRAS_MODEL ?? "gpt-oss-120b",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("cerebras");
      const res = await openAIStyle("cerebras", "https://api.cerebras.ai/v1/chat/completions", key, targetModel, r, s);
      return normalize("cerebras", targetModel, await parseJsonOrError(res, "cerebras"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("cerebras");
      return openAIStyleStream("cerebras", "https://api.cerebras.ai/v1/chat/completions", key, targetModel, r, s);
    }
  },
  {
    id: "sambanova",
    name: "SambaNova",
    model: process.env.SAMBANOVA_MODEL ?? "gemma-4-31B-it",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("sambanova");
      const res = await openAIStyle("sambanova", "https://api.sambanova.ai/v1/chat/completions", key, targetModel, r, s);
      return normalize("sambanova", targetModel, await parseJsonOrError(res, "sambanova"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("sambanova");
      return openAIStyleStream("sambanova", "https://api.sambanova.ai/v1/chat/completions", key, targetModel, r, s);
    }
  },
  {
    id: "cohere",
    name: "Cohere",
    model: process.env.COHERE_MODEL ?? "command-r-plus-08-2024",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("cohere");
      if (!key) throw new Error("cohere API key is not configured");

      const res = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: targetModel,
          messages: r.messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: r.temperature ?? 0.3
        }),
        signal: s
      });
      const data = await parseJsonOrError(res, "cohere");
      const content = data.message?.content?.[0]?.text ?? data.text ?? "";
      const inputTokens = data.usage?.tokens?.input_tokens ?? data.meta?.tokens?.input_tokens;
      const outputTokens = data.usage?.tokens?.output_tokens ?? data.meta?.tokens?.output_tokens;
      return normalize("cohere", targetModel, {
        choices: [{ message: { content } }],
        usage: inputTokens !== undefined
          ? {
              prompt_tokens: inputTokens,
              completion_tokens: outputTokens,
              total_tokens: (inputTokens || 0) + (outputTokens || 0)
            }
          : undefined
      }, res);
    },
    generateStream: function (r, s, modelOverride) {
      return fallbackStreamFromGenerate(this, r, s, modelOverride);
    }
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    model: process.env.CLOUDFLARE_MODEL ?? "@cf/meta/llama-3.1-8b-instruct",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("cloudflare") || process.env.CF_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
      const account = process.env.CLOUDFLARE_ACCOUNT_ID;
      if (!key || !account) throw new Error("cloudflare credentials are not configured");
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${targetModel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ messages: r.messages }),
        signal: s
      });
      const data = await parseJsonOrError(res, "cloudflare");
      return normalize("cloudflare", targetModel, {
        choices: [{ message: { content: data.result?.response } }]
      }, res);
    },
    generateStream: function (r, s, modelOverride) {
      return fallbackStreamFromGenerate(this, r, s, modelOverride);
    }
  },
  {
    id: "gemini",
    name: "Google Gemini",
    model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("gemini");
      if (!key) throw new Error("gemini API key is not configured");
      const system = r.messages.find(m => m.role === "system")?.content;
      const contents = r.messages
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents,
          generationConfig: {
            temperature: r.temperature ?? 0.3,
            maxOutputTokens: r.max_tokens ?? 1024
          }
        }),
        signal: s
      });

      const data = await parseJsonOrError(res, "gemini");
      let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content && data.candidates?.[0]?.content?.parts) {
        content = data.candidates[0].content.parts.map((p: any) => p.text || "").join("");
      }
      if (typeof content !== "string" || !content.trim()) {
        content = data.candidates?.[0]?.finishReason ? `[${data.candidates[0].finishReason}]` : "OK";
      }
      return normalize("gemini", targetModel, {
        choices: [{ message: { content } }],
        usage: data.usageMetadata
          ? {
              prompt_tokens: data.usageMetadata.promptTokenCount,
              completion_tokens: data.usageMetadata.candidatesTokenCount,
              total_tokens: data.usageMetadata.totalTokenCount
            }
          : undefined
      }, res);
    },
    generateStream: async function* (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("gemini");
      if (!key) throw new Error("gemini API key is not configured");
      const system = r.messages.find(m => m.role === "system")?.content;
      const contents = r.messages
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents,
          generationConfig: {
            temperature: r.temperature ?? 0.3,
            maxOutputTokens: r.max_tokens ?? 1024
          }
        }),
        signal: s
      });

      if (!res.ok) {
        const errorText = (await res.text()).slice(0, 500);
        throw new Error(`gemini returned ${res.status}: ${errorText}`);
      }
      if (!res.body) throw new Error("gemini returned no response stream");

      for await (const line of parseSSE(res.body)) {
        try {
          const data = JSON.parse(line);
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          const finish_reason = data.candidates?.[0]?.finishReason ? "stop" : null;
          yield {
            id: `gemini-${Date.now()}`,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            provider: "gemini",
            model: targetModel,
            choices: [
              {
                index: 0,
                delta: { content },
                finish_reason
              }
            ]
          };
        } catch {
          // ignore parsing error
        }
      }
    }
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    model: process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("openrouter");
      const extraHeaders = {
        "HTTP-Referer": "https://zeroroute.app",
        "X-Title": "ZeroRoute Gateway"
      };
      const res = await openAIStyle("openrouter", "https://openrouter.ai/api/v1/chat/completions", key, targetModel, r, s, extraHeaders);
      return normalize("openrouter", targetModel, await parseJsonOrError(res, "openrouter"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("openrouter");
      const extraHeaders = {
        "HTTP-Referer": "https://zeroroute.app",
        "X-Title": "ZeroRoute Gateway"
      };
      return openAIStyleStream("openrouter", "https://openrouter.ai/api/v1/chat/completions", key, targetModel, r, s, extraHeaders);
    }
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    model: process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-lightning-30b-a3b",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("nvidia");
      const res = await openAIStyle("nvidia", "https://integrate.api.nvidia.com/v1/chat/completions", key, targetModel, r, s);
      return normalize("nvidia", targetModel, await parseJsonOrError(res, "nvidia"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("nvidia");
      return openAIStyleStream("nvidia", "https://integrate.api.nvidia.com/v1/chat/completions", key, targetModel, r, s);
    }
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    model: process.env.HUGGINGFACE_MODEL ?? "meta-llama/Llama-3.1-8B-Instruct",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("huggingface");
      const res = await openAIStyle("huggingface", "https://router.huggingface.co/v1/chat/completions", key, targetModel, r, s);
      return normalize("huggingface", targetModel, await parseJsonOrError(res, "huggingface"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("huggingface");
      return openAIStyleStream("huggingface", "https://router.huggingface.co/v1/chat/completions", key, targetModel, r, s);
    }
  },
  {
    id: "bazaarlink",
    name: "BazaarLink AI",
    model: process.env.BAZAARLINK_MODEL ?? "qwen/qwen3.7-flash:free",
    generate: async function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("bazaarlink");
      const res = await openAIStyle("bazaarlink", "https://api.bazaarlink.ai/v1/chat/completions", key, targetModel, r, s);
      return normalize("bazaarlink", targetModel, await parseJsonOrError(res, "bazaarlink"), res);
    },
    generateStream: function (r, s, modelOverride) {
      const targetModel = modelOverride || this.model;
      const key = getProviderApiKey("bazaarlink");
      return openAIStyleStream("bazaarlink", "https://api.bazaarlink.ai/v1/chat/completions", key, targetModel, r, s);
    }
  }
];
