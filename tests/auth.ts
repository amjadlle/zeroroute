import { NextRequest } from "next/server";
import { signAdminSession } from "@/lib/auth/admin-session";
import { invalidateCustomerLookupCache, invalidateSessionCache } from "@/lib/auth/session";
import { testDb } from "@/tests/db";
import { jar } from "@/tests/cookies";

export { jar };

/** Two customers, A (free) and B (pro), each with a cookie session, API key and bot. */
export const A = { id: "cust_a", key: "zr_live_aaaa", session: "zr_sess_aaaa", bot: "bot_aaaa", email: "a@example.com" };
export const B = { id: "cust_b", key: "zr_live_bbbb", session: "zr_sess_bbbb", bot: "bot_bbbb", email: "b@example.com" };

/** Fresh tables with A and B seeded; clears the auth caches and the cookie jar. */
export async function seedCustomers() {
  const db = await testDb();
  for (const t of ["customers", "knowledge_documents", "request_logs", "auth_otps"]) await db.execute(`DELETE FROM ${t}`);
  for (const [c, limit] of [[A, 500], [B, 10000]] as const) {
    await db.execute({
      sql: `INSERT INTO customers (id, key, email, session_token, bot_id, status, monthly_limit, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?, 0, 0)`,
      args: [c.id, c.key, c.email, c.session, c.bot, limit],
    });
  }
  invalidateSessionCache();
  invalidateCustomerLookupCache();
  jar.session = undefined;
  return db;
}

export function loginAs(c: { session: string }) {
  jar.session = c.session;
}

export const ADMIN_SECRET = "test-admin-session-secret-0123456789";

/** Puts a real signed admin session in the jar. */
export async function loginAsAdmin() {
  process.env.ADMIN_SESSION_SECRET = ADMIN_SECRET;
  jar.session = (await signAdminSession())!;
}

/** A JSON request; `bearer` sets the Authorization header. */
export function req(url: string, init: { method?: string; body?: unknown; bearer?: string; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...init.headers };
  if (init.bearer) headers.authorization = `Bearer ${init.bearer}`;
  return new NextRequest(`http://localhost${url}`, {
    method: init.method || (init.body === undefined ? "GET" : "POST"),
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}
