import { describe, expect, it, vi } from "vitest";

// Lets a test make the next N statements fail, like a transient network error at cold start.
const fault = vi.hoisted(() => ({ remaining: 0 }));
vi.mock("@libsql/client", async importOriginal => {
  const real = await importOriginal<typeof import("@libsql/client")>();
  return {
    ...real,
    createClient: (config: Parameters<typeof real.createClient>[0]) => {
      const client = real.createClient(config);
      const execute = client.execute.bind(client) as (stmt: unknown) => Promise<unknown>;
      return Object.assign(client, {
        execute: (stmt: unknown) => {
          if (fault.remaining > 0) {
            fault.remaining--;
            return Promise.reject(new Error("transient"));
          }
          return execute(stmt);
        },
      });
    },
  };
});

const { getDb } = await import("@/lib/db");

// Order matters: the first test runs against a database nothing has initialised yet.
describe("getDb (#42)", () => {
  it("retries a failed init instead of caching the failure", async () => {
    fault.remaining = 1;
    await expect(getDb().execute("SELECT 1")).rejects.toThrow("transient");
    const { rows } = await getDb().execute("SELECT count(*) AS n FROM customers");
    expect(Number(rows[0].n)).toBe(0);
  });

  it("creates the schema before the first query, without an explicit initDb call", async () => {
    const { rows } = await getDb().execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    expect(rows.map(r => r.name)).toEqual(expect.arrayContaining(["customers", "provider_configs", "request_logs"]));
  });

  it("indexes session_token for session lookups", async () => {
    const { rows } = await getDb().execute("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_customers_session_token'");
    expect(rows).toHaveLength(1);
  });
});
