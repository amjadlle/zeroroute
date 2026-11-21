interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function isRateLimited(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();

  // Periodic pruning to prevent memory growth
  if (rateLimits.size > 2000) {
    for (const [k, v] of rateLimits.entries()) {
      if (now > v.resetAt) rateLimits.delete(k);
    }
  }

  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count += 1;
  return false;
}

// Only trust the header the hosting platform overwrites (Vercel: x-real-ip; Cloudflare: cf-connecting-ip).
// Any other client-sent header is spoofable. If a proxy appends to a list, its own entry is the last one.
export function getClientIp(headers: Headers): string {
  const value = headers.get(process.env.CLIENT_IP_HEADER || "x-real-ip");
  return value?.split(",").pop()?.trim() || "127.0.0.1";
}
