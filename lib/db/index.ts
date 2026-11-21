import { createClient, Client, InStatement } from "@libsql/client";
import path from "path";
import fs from "fs";
import { SCHEMA_INDEXES, SCHEMA_TABLES } from "./schema";

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

    // Raw D1 error bodies are logged here only; the thrown message stays generic in case a caller echoes it.
    if (!res.ok) {
      console.error(`[ZeroRoute DB] D1 query failed (${res.status}):`, await res.text());
      throw new Error(`Database query failed (${res.status})`);
    }

    const data = await res.json();
    if (!data.success) {
      console.error("[ZeroRoute DB] D1 error:", JSON.stringify(data.errors || data));
      throw new Error("Database query failed");
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
    const res = await this.client.execute(stmt as InStatement);
    return {
      rows: (res.rows as unknown as Record<string, unknown>[]) || [],
      rowsAffected: res.rowsAffected,
    };
  }
}

let activeAdapter: DatabaseAdapter | null = null;

// The raw connection, without the schema guard. Only initDb uses it directly.
const connect = (): DatabaseAdapter => {
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

// Every query waits for the schema, so no route can reach a fresh database before initDb has run.
// Once init has succeeded this is one already-resolved await per query.
const guardedDb: DatabaseAdapter = {
  execute: async stmt => {
    await initDb();
    return connect().execute(stmt);
  },
};

export const getDb = (): DatabaseAdapter => guardedDb;

let initPromise: Promise<void> | null = null;

// Memoised per instance. A failed init is forgotten so the next request retries it
// instead of every request failing until the instance restarts.
export const initDb = (): Promise<void> =>
  (initPromise ??= applySchema(connect()).catch(err => {
    initPromise = null;
    throw err;
  }));

async function applySchema(db: DatabaseAdapter): Promise<void> {
  await Promise.all(SCHEMA_TABLES.map(sql => db.execute(sql)));
  // Additive columns for databases created before them. SQLite has no ADD COLUMN IF NOT EXISTS: a rerun
  // fails with "duplicate column", which is ignored, so this stays idempotent.
  for (const col of ["brand_color TEXT", "logo_url TEXT"]) {
    try {
      await db.execute(`ALTER TABLE customers ADD COLUMN ${col};`);
    } catch {}
  }
  // allSettled: an index on a column an old database does not have yet must not block startup.
  await Promise.allSettled(SCHEMA_INDEXES.map(sql => db.execute(sql)));
}
