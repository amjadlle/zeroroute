// Small pure decisions used by the chat completions and customer domains routes (kept here so they
// can be unit tested; route files may only export handlers).

export const CHAT_LIMITS = {
  maxBodyBytes: 256_000,
  maxMessages: 50,
  maxMessageChars: 16_000,
  maxTotalChars: 48_000,
  maxTokens: 4096
};

const DEMO_HOSTS = ["zeroroute.mapki.in", "mapki.in", "www.mapki.in"];
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

function parseUrl(value: string | null | undefined): URL | null {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}

/** Demo bot may only be called from the official site (exact host match). */
export function isDemoOrigin(originOrReferer: string | null, allowLocal: boolean): boolean {
  const host = parseUrl(originOrReferer)?.hostname;
  return Boolean(host && (DEMO_HOSTS.includes(host) || (allowLocal && LOCAL_HOSTS.includes(host))));
}

/** Customer domain allowlist: exact host match; "*.example.com" allows subdomains, "*" allows all. */
export function isHostAllowed(originOrReferer: string | null, allowed: string[]): boolean {
  const host = parseUrl(originOrReferer)?.hostname;
  return allowed.some(entry => {
    const pattern = String(entry).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/:].*$/, "");
    if (pattern === "*") return true;
    if (!host) return false;
    if (pattern.startsWith("*.")) return host.endsWith(pattern.slice(1));
    return host === pattern;
  });
}

/** Cookie auth is only for same-origin calls (no Origin header, or Origin host equals our host). */
export function isSameOrigin(origin: string | null, host: string): boolean {
  return !origin || parseUrl(origin)?.host === host;
}

const ROLES = ["system", "user", "assistant", "tool"];

type Part = { type?: unknown; text?: unknown };
const isValidContent = (c: unknown) =>
  c == null ||
  typeof c === "string" ||
  (Array.isArray(c) && c.every((p: Part) => p && typeof p.type === "string" && (p.type !== "text" || typeof p.text === "string")));

/** OpenAI-style content (string or [{type:"text",text}, ...]) as plain text; non-text parts are dropped. */
export function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((p: Part) => p?.type === "text").map((p: Part) => p.text).join("\n");
}

/** Returns an HTTP error for an oversized or malformed body, or null when it is acceptable. */
export function chatBodyError(body: { messages?: unknown; max_tokens?: unknown }): { status: number; message: string } | null {
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return { status: 400, message: "messages must be a non-empty array" };
  }
  if (body.messages.length > CHAT_LIMITS.maxMessages) {
    return { status: 413, message: `Too many messages (max ${CHAT_LIMITS.maxMessages}).` };
  }
  let total = 0;
  for (const m of body.messages) {
    if (!m || !ROLES.includes(m.role) || !isValidContent(m.content)) {
      return { status: 400, message: `Each message needs a role (${ROLES.join(", ")}) and string or text-part content.` };
    }
    const len = contentText(m.content).length;
    if (len > CHAT_LIMITS.maxMessageChars) {
      return { status: 413, message: `Message too long (max ${CHAT_LIMITS.maxMessageChars} characters).` };
    }
    total += len;
  }
  if (total > CHAT_LIMITS.maxTotalChars) {
    return { status: 413, message: `Conversation too long (max ${CHAT_LIMITS.maxTotalChars} characters).` };
  }
  if (body.max_tokens !== undefined && !(Number.isInteger(body.max_tokens) && Number(body.max_tokens) > 0)) {
    return { status: 400, message: "max_tokens must be a positive integer" };
  }
  return null;
}

// Failover budget per request, so one bad request cannot fan out across every provider x model.
export const MAX_ATTEMPTS = 6;
export const MAX_WALL_MS = 30_000;

/** Upstream 400/413/422 mean the request itself is bad: return it, don't fail over or cool down. */
export function isFailoverError(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status;
  return !(err instanceof Error && typeof status === "number" && [400, 413, 422].includes(status));
}

/** Models to try for one provider: its configured list (or default), with the requested model moved to the front. */
export function modelChain(stateModels: string[] | undefined, defaultModel: string, targetModel?: string): string[] {
  const base = stateModels && stateModels.length > 0 ? [...stateModels] : [defaultModel];
  if (targetModel && targetModel !== "auto" && targetModel !== "default") {
    const idx = base.findIndex(m => m.toLowerCase() === targetModel.toLowerCase());
    if (idx > 0) {
      const matched = base.splice(idx, 1)[0];
      return [matched, ...base];
    }
  }
  return base;
}

/** Per-attempt timeout, or 0 once the request's attempt/wall-time budget is spent. */
export function attemptTimeoutMs(attempts: number, elapsedMs: number, perAttemptMs: number): number {
  const left = MAX_WALL_MS - elapsedMs;
  return attempts < MAX_ATTEMPTS && left > 0 ? Math.min(perAttemptMs, left) : 0;
}

/** State changes for a provider whose every model failed: count it and cool it down. */
export function providerFailure(consecutiveFailures: number | undefined, lastError: string, now: number, cooldownMs: number) {
  return { consecutiveFailures: (consecutiveFailures || 0) + 1, cooldownUntil: now + cooldownMs, lastError };
}

/** customers.allowed_domains (JSON text or array) as a list; unparseable values mean "no allowlist". */
export function parseAllowedDomains(value: unknown): string[] {
  try {
    const allowed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(allowed) ? allowed : [];
  } catch {
    return [];
  }
}

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/** Monthly limit from the live row; a missing column means the free 500. */
export function quotaLimit(monthlyLimit: unknown): number {
  return Number(monthlyLimit !== undefined ? monthlyLimit : 500);
}

/** A fresh 30-day period when the current one has ended, else null. */
export function renewedPeriod(periodEnd: unknown, now: number): { start: number; end: number } | null {
  const end = Number(periodEnd || 0);
  return end > 0 && now > end ? { start: now, end: now + PERIOD_MS } : null;
}

/** 402 message for a non-active subscription; widget visitors don't see billing details. */
export function inactiveMessage(status: string, publicWidget: boolean): string {
  return publicWidget
    ? "This assistant is temporarily unavailable. Please contact the website owner or try again later."
    : `Your ZeroRoute subscription is currently inactive (${status}). Please visit your dashboard to manage billing.`;
}

/** 429 message once the monthly quota is used up. */
export function quotaExceededMessage(limit: number, publicWidget: boolean): string {
  return publicWidget
    ? "This assistant has reached its monthly conversation limit and is temporarily unavailable. Please contact the website owner or check back next month."
    : `Monthly request quota of ${limit.toLocaleString()} requests reached (${limit}/${limit} used). Please upgrade to ZeroRoute Pro for 10,000 requests/month.`;
}

/** Allowlist entries as bare lowercase hosts (no protocol, path or port), deduplicated. */
export function cleanDomains(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from(
    new Set(
      list
        .map((d: unknown) =>
          String(d || "")
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/.*$/, "")
            .replace(/:\d+$/, "")
        )
        .filter(d => Boolean(d) && d.length > 2)
    )
  );
}

/** Error when a plan's domain allowance is exceeded (Pro: 3, free: 1), else null. */
export function domainLimitError(count: number, monthlyLimit: number | null | undefined): string | null {
  const isPro = Boolean(monthlyLimit && monthlyLimit >= 10000);
  if (count <= (isPro ? 3 : 1)) return null;
  return isPro
    ? `Pro accounts can whitelist up to 3 domains.`
    : `Free accounts can whitelist 1 website domain. Upgrade to Pro for up to 3 domains.`;
}
