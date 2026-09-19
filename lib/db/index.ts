import { createClient, Client } from "@libsql/client";
import path from "path";
import fs from "fs";

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowsAffected?: number;
}

export interface DatabaseAdapter {
  execute: (stmt: { sql: string; args?: unknown[] } | string) => Promise<QueryResult>;
}

// 1. Cloudflare D1 REST API Database Adapter
class CloudflareD1Adapter implements DatabaseAdapter {
  private accountId: string;
  private databaseId: string;
  private apiToken: string;

  constructor(accountId: string, databaseId: string, apiToken: string) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.apiToken = apiToken;
  }

  async execute(stmt: { sql: string; args?: unknown[] } | string): Promise<QueryResult> {
    const sql = typeof stmt === "string" ? stmt : stmt.sql;
    const params = typeof stmt === "string" ? [] : stmt.args || [];

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloudflare D1 Query Failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(`Cloudflare D1 Error: ${JSON.stringify(data.errors || data)}`);
    }

    const firstResult = data.result?.[0] || {};
    return {
      rows: firstResult.results || [],
      rowsAffected: firstResult.meta?.rows_written || firstResult.meta?.changes || 0,
    };
  }
}

// 2. LibSQL / SQLite Local Adapter
class LibSqlAdapter implements DatabaseAdapter {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async execute(stmt: { sql: string; args?: unknown[] } | string): Promise<QueryResult> {
    const res = await this.client.execute(stmt as any);
    return {
      rows: (res.rows as unknown as Record<string, unknown>[]) || [],
      rowsAffected: res.rowsAffected,
    };
  }
}

let activeAdapter: DatabaseAdapter | null = null;
let initialized = false;

export const getDb = (): DatabaseAdapter => {
  if (activeAdapter) return activeAdapter;

  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfDatabaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const cfD1Token = process.env.CLOUDFLARE_D1_TOKEN;

  // Use Cloudflare D1 when explicitly configured with a D1 token
  if ((process.env.USE_CLOUDFLARE_D1 === "true" || cfD1Token) && cfAccountId && cfDatabaseId && cfD1Token) {
    console.log(`[ZeroRoute DB] Connected to Cloudflare D1 (Database ID: ${cfDatabaseId})`);
    activeAdapter = new CloudflareD1Adapter(cfAccountId, cfDatabaseId, cfD1Token);
    return activeAdapter;
  }

  // Fallback to local SQLite / libSQL
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, "zeroroute.db");
  const dbUrl = process.env.DATABASE_URL || `file:${dbPath}`;

  const client = createClient({
    url: dbUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  activeAdapter = new LibSqlAdapter(client);
  return activeAdapter;
};

let initPromise: Promise<void> | null = null;

export const initDb = async (): Promise<void> => {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = getDb();

    // Run core table creation concurrently
    await Promise.all([
      db.execute(`
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
      `),
      db.execute(`
        CREATE TABLE IF NOT EXISTS auth_otps (
          email TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          attempts INTEGER DEFAULT 0
        );
      `),
      db.execute(`
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
      `),
      db.execute(`
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
      `),
      db.execute(`
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
      `),
    ]);

    // Create indexes concurrently
    await Promise.allSettled([
      db.execute(`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);`),
      db.execute(`CREATE INDEX IF NOT EXISTS idx_customers_key ON customers(key);`),
      db.execute(`CREATE INDEX IF NOT EXISTS idx_knowledge_customer ON knowledge_documents(customer_key);`),
      db.execute(`CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_documents(created_at);`),
      db.execute(`CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_documents(type);`),
      db.execute(`CREATE INDEX IF NOT EXISTS idx_logs_customer ON request_logs(customer_key);`),
    ]);

    // Auto-upgrade existing customers to 10,000 monthly limit
    try {
      await db.execute(`UPDATE customers SET monthly_limit = 10000 WHERE monthly_limit = 2000 OR monthly_limit IS NULL;`);
    } catch {}

    initialized = true;
  })();

  return initPromise;
};
