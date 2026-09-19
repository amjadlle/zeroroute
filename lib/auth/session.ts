import { cookies } from "next/headers";
import { getDb, initDb } from "@/lib/db";
import { Customer } from "@/lib/db/schema";

export const SESSION_COOKIE_NAME = "zr_session";
export const ROLE_COOKIE_NAME = "zr_role";

export const ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || "mapkisolutions@gmail.com").toLowerCase(),
];

export function isMasterAdminKey(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const clean = token.trim();
  const adminKey = process.env.ADMIN_KEY;
  const routerKey = process.env.ROUTER_API_KEY;

  if (adminKey && clean === adminKey.trim()) return true;
  if (routerKey && clean === routerKey.trim()) return true;

  // Fallback for default local development if no key configured
  if (!adminKey && !routerKey && process.env.NODE_ENV !== "production") {
    return clean === "zr_admin_master_dev";
  }

  return false;
}

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
  customer: any;
  expiresAt: number;
}
const customerLookupCache = globalForAuth.zrCustomerLookupCache || new Map<string, CustomerLookupEntry>();
if (!globalForAuth.zrCustomerLookupCache) globalForAuth.zrCustomerLookupCache = customerLookupCache;

export function getCachedCustomer(id: string): any | null {
  const cached = customerLookupCache.get(id);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.customer;
  }
  return null;
}

export function setCachedCustomer(id: string, customer: any, ttlMs = 30_000) {
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

export async function getCurrentUser(): Promise<Customer | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  // Check admin session
  if (sessionToken.startsWith("zr_admin_")) {
    return {
      id: "admin_master",
      key: process.env.ROUTER_API_KEY || process.env.ADMIN_KEY || "zr_admin_master",
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

export async function getSessionFromCookie(): Promise<Customer | null> {
  return getCurrentUser();
}

export async function resolveAuth(headerOrToken?: string): Promise<{
  isAdmin: boolean;
  role: "admin" | "customer";
  customer: Customer | null;
}> {
  if (headerOrToken) {
    const clean = headerOrToken.replace(/^Bearer\s+/i, "").trim();
    if (isMasterAdminKey(clean)) {
      return {
        isAdmin: true,
        role: "admin",
        customer: {
          id: "admin_master",
          key: clean,
          email: process.env.ADMIN_EMAIL || "mapkisolutions@gmail.com",
          name: "ZeroRoute Admin",
          company: "ZeroRoute Master",
          status: "active",
          monthly_requests: 0,
          monthly_limit: 999999999,
          created_at: 1700000000000,
          updated_at: Date.now(),
        } as Customer,
      };
    }
  }

  const user = await getCurrentUser();
  if (user) {
    const isAdmin =
      ADMIN_EMAILS.includes(user.email.toLowerCase()) ||
      Boolean(user.id === "admin_master") ||
      Boolean(user.key && isMasterAdminKey(user.key));

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

export async function getCustomerByTokenOrKey(token: string): Promise<Customer | null> {
  if (!token) return null;

  if (isMasterAdminKey(token)) {
    return {
      id: "admin_master",
      key: token,
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

  const cached = sessionCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.customer;
  }

  await initDb();
  const db = getDb();

  const result = await db.execute({
    sql: "SELECT * FROM customers WHERE key = ? OR session_token = ? OR id = ? LIMIT 1",
    args: [token, token, token],
  });

  if (result.rows.length > 0) {
    const customer = result.rows[0] as unknown as Customer;
    sessionCache.set(token, { customer, expiresAt: Date.now() + 30_000 });
    return customer;
  }

  return null;
}

