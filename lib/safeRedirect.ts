/**
 * Returns `raw` when it is a same-origin path ("/app/usage?x=1"), otherwise null.
 * Rejects absolute URLs, protocol-relative ("//evil.com") and backslash tricks ("/\evil.com"),
 * which browsers treat as another host.
 */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\\\s\u0000-\u001f]/.test(raw)) return null;
  try {
    const base = "http://same.origin";
    const url = new URL(raw, base);
    return url.origin === base ? url.pathname + url.search + url.hash : null;
  } catch {
    return null;
  }
}
