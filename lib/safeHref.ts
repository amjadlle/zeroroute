const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Returns a normalised href when `url` is an absolute http:, https: or mailto: URL, otherwise null.
 * Relative and protocol-relative URLs are rejected too: chat output must not point into the console.
 */
export function safeHref(url: string): string | null {
  const trimmed = url.trim();
  // Demand a plain scheme up front: the URL parser strips tabs/newlines, so "java\tscript:" would pass it.
  if (!/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}
