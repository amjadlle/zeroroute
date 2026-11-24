import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";
import { Customer } from "@/lib/db/schema";
import { verifyAdminSession } from "@/lib/auth/admin-session";

export const SESSION_COOKIE_NAME = "zr_session";

export const ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || "mapkisolutions@gmail.com").toLowerCase(),
];

export function isMasterAdminKey(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const clean = token.trim();
  const routerKey = process.env.ROUTER_API_KEY;

  if (routerKey && clean === routerKey.trim()) return true;

  return false;
}

// Ceiling: both caches below are per-instance memory with a 30 second TTL. The invalidate helpers
// only clear the instance that handled the change, so other instances may serve the old customer
// row (status, key, limits) for up to 30 seconds. Upgrade path: a shared store such as Redis.
interface SessionCacheEntry {
  customer: Customer;
  expiresAt: number;
}
const globalForAuth = globalThis as unknown as {
  zrSessionCache?: Map<string, SessionCacheEntry>;
  zrCustomerLookupCache?: Map<string, CustomerLookupEntry>;
};

const sessionCache = globalForAuth.zrSessionCache || new Map<string, SessionCacheEntry>();
if (!globalForAuth.zrSessionCache) globalForAuth.zrSessionCache = sessionCache;

export function invalidateSessionCache(tokenOrKey?: string) {
  if (tokenOrKey) sessionCache.delete(tokenOrKey);
  else sessionCache.clear();
}

interface CustomerLookupEntry {
  customer: Customer;
  expiresAt: number;
}
const customerLookupCache = globalForAuth.zrCustomerLookupCache || new Map<string, CustomerLookupEntry>();
if (!globalForAuth.zrCustomerLookupCache) globalForAuth.zrCustomerLookupCache = customerLookupCache;

export function getCachedCustomer(id: string): Customer | null {
  const cached = customerLookupCache.get(id);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.customer;
  }
  return null;
}

export function setCachedCustomer(id: string, customer: Customer, ttlMs = 30_000) {
  customerLookupCache.set(id, { customer, expiresAt: Date.now() + ttlMs });
  if (customer.key) customerLookupCache.set(customer.key, { customer, expiresAt: Date.now() + ttlMs });
  if (customer.bot_id) customerLookupCache.set(customer.bot_id, { customer, expiresAt: Date.now() + ttlMs });
}

export function invalidateCustomerLookupCache(tokenOrKey?: string) {
  if (tokenOrKey) {
    customerLookupCache.delete(tokenOrKey);
  } else {
    customerLookupCache.clear();
  }
}

/**
 * Drops every cached entry for one customer (cookie session, API key, bot id, lookups), so a key
 * rotation, password reset or status change takes effect on this instance at once.
 * Linear scan over both caches; fine at current sizes. Upgrade path: index entries by customer id.
 */
export function invalidateCustomer(customerId: string) {
  for (const cache of [sessionCache, customerLookupCache] as Map<string, { customer: Customer }>[]) {
    for (const [k, v] of cache) if (v.customer.id === customerId) cache.delete(k);
  }
}

export async function getCurrentUser(): Promise<Customer | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  // Check admin session (signed JWT issued by the admin login)
  if (await verifyAdminSession(sessionToken)) {
    return {
      id: "admin_master",
      key: process.env.ROUTER_API_KEY || "zr_admin_master",
      email: process.env.ADMIN_EMAIL || "mapkisolutions@gmail.com",
      name: "ZeroRoute Admin",
      company: "ZeroRoute Master",
      bot_title: "Master Admin AI",
      bot_role: "Superadmin",
      status: "active",
      monthly_requests: 0,
      monthly_limit: 999999999,
      created_at: 1700000000000,
      updated_at: Date.now(),
    } as Customer;
  }

  // Check in-memory cache (30s TTL)
  const cached = sessionCache.get(sessionToken);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.customer;
  }

  await initDb();
  const db = getDb();

  const result = await db.execute({
    sql: "SELECT * FROM customers WHERE session_token = ? LIMIT 1",
    args: [sessionToken],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const customer = result.rows[0] as unknown as Customer;
  sessionCache.set(sessionToken, { customer, expiresAt: Date.now() + 30_000 });
  return customer;
}

// Admin requires the verified admin session cookie. The header argument is kept for
// call-site compatibility; bearer keys never grant admin.
export async function resolveAuth(_headerOrToken?: string): Promise<{
  isAdmin: boolean;
  role: "admin" | "customer";
  customer: Customer | null;
}> {
  const user = await getCurrentUser();
  if (user) {
    const isAdmin = user.id === "admin_master";

    return {
      isAdmin,
      role: isAdmin ? "admin" : "customer",
      customer: user,
    };
  }

  return {
    isAdmin: false,
    role: "customer",
    customer: null,
  };
}

// Bearer lookup: matches customer API keys only.
export async function getCustomerByTokenOrKey(token: string): Promise<Customer | null> {
  if (!token) return null;

  // Prefixed so a cached cookie-session entry can never satisfy a bearer lookup.
  const cacheKey = `key:${token}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.customer;
  }

  await initDb();
  const db = getDb();

  const result = await db.execute({
    sql: "SELECT * FROM customers WHERE key = ? LIMIT 1",
    args: [token],
  });

  if (result.rows.length > 0) {
    const customer = result.rows[0] as unknown as Customer;
    sessionCache.set(cacheKey, { customer, expiresAt: Date.now() + 30_000 });
    return customer;
  }

  return null;
}

