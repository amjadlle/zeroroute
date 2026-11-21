// Small pure decisions used by app/v1/chat/completions/route.ts (kept here so they can be unit tested;
// route files may only export handlers).

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
