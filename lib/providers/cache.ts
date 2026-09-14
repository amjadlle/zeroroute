import crypto from "crypto";
import type { ChatRequest, ChatResponse, ChatStreamChunk } from "./types";

interface CacheEntry {
  response: ChatResponse;
  expiresAt: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTtlMs = 60 * 1000; // 1 minute default cache

  generateKey(request: ChatRequest): string {
    const serialized = JSON.stringify({
      messages: request.messages,
      model: request.model || "auto",
      temperature: request.temperature ?? 0.3
    });
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  get(key: string): ChatResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.response;
  }

  set(key: string, response: ChatResponse, ttlMs = this.defaultTtlMs): void {
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      response,
      expiresAt: Date.now() + ttlMs
    });
  }

  async *streamCachedResponse(response: ChatResponse): AsyncIterable<ChatStreamChunk> {
    const content = response.choices[0]?.message?.content || "";
    const words = content.split(" ");
    for (let i = 0; i < words.length; i++) {
      const chunkText = (i === 0 ? "" : " ") + words[i];
      yield {
        id: response.id,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        provider: response.provider,
        model: response.model,
        choices: [
          {
            index: 0,
            delta: { content: chunkText },
            finish_reason: i === words.length - 1 ? "stop" : null
          }
        ]
      };
    }
  }
}

export const responseCache = new ResponseCache();
