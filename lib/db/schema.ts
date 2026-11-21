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
  brand_color?: string | null;
  logo_url?: string | null;
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

// The only copy of the schema: initDb applies it on first use, tests get it through testDb().
// Every statement must stay idempotent and additive, because it runs against the live database
// on each cold start. Changing an existing table needs a migration, not an edit here.
export const SCHEMA_TABLES = [
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    password_salt TEXT,
    name TEXT,
    company TEXT,
    website TEXT,
    bot_title TEXT DEFAULT 'ZeroRoute AI',
    bot_role TEXT DEFAULT 'AI Assistant',
    tone TEXT DEFAULT 'helpful and concise',
    greeting TEXT DEFAULT 'Hi there! How can I help you today?',
    prompts TEXT DEFAULT '[]',
    persona TEXT,
    status TEXT DEFAULT 'active',
    subscription_expires INTEGER,
    monthly_requests INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 10000,
    period_start INTEGER,
    period_end INTEGER,
    bot_id TEXT UNIQUE,
    allowed_domains TEXT DEFAULT '[]',
    session_token TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_otps (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS knowledge_documents (
    id TEXT PRIMARY KEY,
    customer_key TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    char_count INTEGER NOT NULL,
    source_url TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS request_logs (
    id TEXT PRIMARY KEY,
    customer_key TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    origin TEXT,
    prompt_preview TEXT,
    response_preview TEXT,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    status INTEGER NOT NULL,
    is_stream INTEGER DEFAULT 0,
    is_cache_hit INTEGER DEFAULT 0,
    failovers TEXT DEFAULT '[]',
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS checkout_claims (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    claimed_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS provider_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 1,
    primary_model TEXT NOT NULL,
    models TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  // Payment webhook ids already handled (dedupes provider retries) and each event's own time,
  // so an older event that arrives late can't undo a newer one.
  `CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    email TEXT,
    event_at INTEGER NOT NULL,
    received_at INTEGER NOT NULL
  )`,
];

export const SCHEMA_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_key ON customers(key)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_bot_id ON customers(bot_id)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_session_token ON customers(session_token)`,
  `CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_customer ON knowledge_documents(customer_key)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_documents(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_documents(type)`,
  `CREATE INDEX IF NOT EXISTS idx_logs_customer ON request_logs(customer_key)`,
  `CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON request_logs(timestamp DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_logs_origin ON request_logs(origin)`,
  `CREATE INDEX IF NOT EXISTS idx_logs_provider ON request_logs(provider)`,
  `CREATE INDEX IF NOT EXISTS idx_logs_status ON request_logs(status)`,
  `CREATE INDEX IF NOT EXISTS idx_webhook_events_email ON webhook_events(email, event_at)`,
];
