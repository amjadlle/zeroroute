export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  bot_id?: string;
}

export interface ChatStreamChunkChoice {
  index: number;
  delta: {
    role?: string;
    content?: string;
  };
  finish_reason?: string | null;
}

export interface ChatStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  provider: string;
  model: string;
  choices: ChatStreamChunkChoice[];
}

export interface ChatResponseChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: string;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface RateLimitTelemetry {
  remainingRequests?: string;
  limitRequests?: string;
  remainingTokens?: string;
  limitTokens?: string;
  resetRequests?: string;
  resetTokens?: string;
  retryAfter?: string;
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  provider: string;
  model: string;
  choices: ChatResponseChoice[];
  usage?: ChatUsage;
  telemetry?: RateLimitTelemetry;
}

export interface ProviderRuntimeState {
  id: string;
  name: string;
  model: string;
  models: string[];
  enabled: boolean;
  order: number;
  configured: boolean;
  consecutiveFailures: number;
  cooldownUntil: number;
  lastLatencyMs?: number;
  lastError?: string;
}

export interface Provider {
  id: string;
  name: string;
  model: string;
  generate: (request: ChatRequest, signal?: AbortSignal, modelOverride?: string) => Promise<ChatResponse>;
  generateStream: (request: ChatRequest, signal?: AbortSignal, modelOverride?: string) => AsyncIterable<ChatStreamChunk>;
}
