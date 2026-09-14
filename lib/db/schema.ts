export interface Customer {
  id: string;
  key: string;
  email: string;
  password_hash?: string | null;
  password_salt?: string | null;
  name?: string | null;
  company?: string | null;
  website?: string | null;
  bot_title?: string;
  bot_role?: string;
  tone?: string;
  greeting?: string;
  prompts?: string;
  persona?: string | null;
  status: string;
  subscription_expires?: number | null;
  monthly_requests: number;
  monthly_limit: number;
  period_start?: number | null;
  period_end?: number | null;
  bot_id?: string | null;
  allowed_domains?: string;
  session_token?: string | null;
  created_at: number;
  updated_at: number;
}

export interface AuthOtp {
  email: string;
  code: string;
  expires_at: number;
  attempts: number;
}

export interface KnowledgeDocument {
  id: string;
  customer_key: string;
  title: string;
  type: string;
  content: string;
  char_count: number;
  source_url?: string | null;
  created_at: number;
}

export interface RequestLog {
  id: string;
  customer_key: string;
  timestamp: number;
  origin?: string | null;
  prompt_preview?: string | null;
  response_preview?: string | null;
  provider: string;
  model: string;
  latency_ms: number;
  status: number;
  is_stream: number;
  is_cache_hit: number;
  failovers: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
