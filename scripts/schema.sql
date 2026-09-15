-- ZeroRoute Production Database Schema for Cloudflare D1 / SQLite

CREATE TABLE IF NOT EXISTS customers (
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
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_key ON customers(key);
CREATE INDEX IF NOT EXISTS idx_customers_bot_id ON customers(bot_id);

CREATE TABLE IF NOT EXISTS auth_otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  customer_key TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  source_url TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_customer ON knowledge_documents(customer_key);

CREATE TABLE IF NOT EXISTS request_logs (
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
);

CREATE INDEX IF NOT EXISTS idx_logs_customer ON request_logs(customer_key);

CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 1,
  primary_model TEXT NOT NULL,
  models TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

