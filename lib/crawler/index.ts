import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

export type LiveSourceType = "google_docs" | "github_raw" | "notion" | "website" | "raw_text";

export interface CrawlResult {
  url: string;
  normalizedUrl: string;
  sourceType: LiveSourceType;
  title: string;
  content: string;
  charCount: number;
}

const BLOCKED_MESSAGE = "Access to private, loopback, or internal addresses is prohibited.";
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

// Non-public ranges. IPv4 rules also match IPv4-mapped IPv6 (::ffff:a.b.c.d).
const blockedRanges = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], // "this network" / unspecified
  ["10.0.0.0", 8], // RFC 1918
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local / cloud metadata
  ["172.16.0.0", 12], // RFC 1918
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // RFC 1918
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
] as const) blockedRanges.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 96], // unspecified, loopback, IPv4-compatible
  ["64:ff9b::", 96], // NAT64
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const) blockedRanges.addSubnet(net, prefix, "ipv6");

function isPrivateIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 0) return true;
  return blockedRanges.check(ip, family === 4 ? "ipv4" : "ipv6");
}

/**
 * Checks for private / loopback / cloud metadata IP addresses to prevent SSRF.
 * Synchronous URL-only check; crawlSourceUrl also checks the resolved addresses.
 */
export function isSsrfSafeUrl(rawUrl: string): boolean {
  try {
    if (!rawUrl || typeof rawUrl !== "string" || rawUrl.length > 2048) return false;
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;

    // WHATWG URL already turns decimal/hex/octal IPv4 into dotted form; strip IPv6 brackets and a trailing dot.
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (isIP(host)) return !isPrivateIp(host);

    return !(
      host === "localhost" ||
      host.endsWith(".internal") ||
      host.endsWith(".local") ||
      host.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

/**
 * Throws unless the URL passes isSsrfSafeUrl and every address its host resolves to is public.
 * Ceiling: DNS-rebinding TOCTOU. fetch resolves the name again and the checked IP isn't pinned
 * for the connection. Upgrade path: a custom undici dispatcher whose connect `lookup` runs this check.
 */
async function assertPublicUrl(url: string): Promise<void> {
  if (isSsrfSafeUrl(url)) {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
    const addresses = await lookup(host, { all: true });
    if (addresses.length > 0 && addresses.every((a) => !isPrivateIp(a.address))) return;
  }
  throw new Error(BLOCKED_MESSAGE);
}

/** Reads at most maxBytes of the body, then cancels the stream. */
async function readCappedText(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel();
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxBytes));
}

/**
 * Normalizes input URL and auto-detects source type across the 5 categories.
 */
export function normalizeSourceUrl(rawUrl: string): {
  normalizedUrl: string;
  sourceType: LiveSourceType;
  suggestedTitle?: string;
} {
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;

  // 1. Google Docs (Published to Web)
  if (host.includes("docs.google.com") && pathname.includes("/document/d/")) {
    let pubUrl = url;
    if (pathname.includes("/edit") || pathname.includes("/view")) {
      pubUrl = url.replace(/\/edit.*$/, "/pub").replace(/\/view.*$/, "/pub");
    }
    return {
      normalizedUrl: pubUrl,
      sourceType: "google_docs",
      suggestedTitle: "Google Doc",
    };
  }

  // 2. GitHub Raw Markdown
  if (host === "raw.githubusercontent.com") {
    const filename = pathname.split("/").pop() || "GitHub Markdown";
    return {
      normalizedUrl: url,
      sourceType: "github_raw",
      suggestedTitle: decodeURIComponent(filename),
    };
  }
  if (host === "github.com" && pathname.includes("/blob/")) {
    const rawPath = pathname.replace("/blob/", "/");
    const rawGithubUrl = `https://raw.githubusercontent.com${rawPath}`;
    const filename = pathname.split("/").pop() || "GitHub Markdown";
    return {
      normalizedUrl: rawGithubUrl,
      sourceType: "github_raw",
      suggestedTitle: decodeURIComponent(filename),
    };
  }

  // 3. Notion Public Page
  if (host.endsWith("notion.site") || host.endsWith("notion.so")) {
    return {
      normalizedUrl: url,
      sourceType: "notion",
      suggestedTitle: "Notion Knowledge Base",
    };
  }

  // 4. Raw Markdown / Text File URL (.md, .txt, .json, .csv)
  if (/\.(md|markdown|txt|text|json|csv)$/i.test(pathname)) {
    const filename = pathname.split("/").pop() || "Raw Document";
    return {
      normalizedUrl: url,
      sourceType: "raw_text",
      suggestedTitle: decodeURIComponent(filename),
    };
  }

  // 5. Company Website / Help Center
  const domainTitle = host.replace(/^www\./, "") + (pathname === "/" ? "" : pathname);
  return {
    normalizedUrl: url,
    sourceType: "website",
    suggestedTitle: domainTitle,
  };
}

/**
 * Strips HTML tags and extracts clean structured text/markdown.
 */
export function cleanHtmlToMarkdown(html: string): string {
  return html
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, " ")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<h1\b[^>]*>(.*?)<\/h1>/gi, "\n\n# $1\n")
    .replace(/<h2\b[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n")
    .replace(/<h3\b[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n")
    .replace(/<h[4-6]\b[^>]*>(.*?)<\/h[4-6]>/gi, "\n\n#### $1\n")
    .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b\b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em\b[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i\b[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<li\b[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<p\b[^>]*>(.*?)<\/p>/gi, "\n\n$1")
    .replace(/<tr\b[^>]*>(.*?)<\/tr>/gi, "\n$1")
    .replace(/<td\b[^>]*>(.*?)<\/td>/gi, " | $1")
    .replace(/<th\b[^>]*>(.*?)<\/th>/gi, " | **$1**")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

export interface ExtractedMeta {
  title?: string;
  description?: string;
  keywords?: string;
  jsonLd?: string;
}

/**
 * Extracts rich metadata from <head> (meta tags, OpenGraph, JSON-LD)
 * for Single Page Applications (SPAs) and JavaScript-heavy sites.
 */
export function extractHtmlMetadata(html: string): ExtractedMeta {
  const result: ExtractedMeta = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    result.title = titleMatch[1].replace(/ - Google Docs$/i, "").replace(/ \| Notion$/i, "").trim();
  }

  // Meta Description / OpenGraph / Twitter description
  const descMatch =
    html.match(/<meta\b[^>]*?\b(?:name|property)=["'](?:description|og:description|twitter:description)["'][^>]*?\bcontent=["']([\s\S]*?)["']/i) ||
    html.match(/<meta\b[^>]*?\bcontent=["']([\s\S]*?)["'][^>]*?\b(?:name|property)=["'](?:description|og:description|twitter:description)["']/i);
  if (descMatch && descMatch[1]) {
    result.description = descMatch[1].trim();
  }

  // Keywords
  const kwMatch =
    html.match(/<meta\b[^>]*?\bname=["']keywords["'][^>]*?\bcontent=["']([\s\S]*?)["']/i) ||
    html.match(/<meta\b[^>]*?\bcontent=["']([\s\S]*?)["'][^>]*?\bname=["']keywords["']/i);
  if (kwMatch && kwMatch[1]) {
    result.keywords = kwMatch[1].trim();
  }

  // JSON-LD structured schemas
  try {
    const jsonLdMatch = html.match(/<script\b[^>]*?\btype=["']application\/ld\+json["'][^>]*?>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      const parsed = JSON.parse(jsonLdMatch[1].trim());
      result.jsonLd = typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : String(parsed);
    }
  } catch {}

  return result;
}

/**
 * Fetches and parses a single live URL across any of the 5 supported source types.
 */
export async function crawlSourceUrl(rawUrl: string, customTitle?: string): Promise<CrawlResult> {
  const { normalizedUrl, sourceType, suggestedTitle } = normalizeSourceUrl(rawUrl);

  // Follow redirects by hand so every hop is re-validated. One timeout covers all hops and the body.
  const signal = AbortSignal.timeout(12000);
  let url = normalizedUrl;
  let fetchRes: Response;
  for (let hop = 0; ; hop++) {
    await assertPublicUrl(url);
    fetchRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeroRoute-Knowledge-Crawler/2.0",
        Accept: "text/html,text/markdown,text/plain,application/json,*/*",
      },
      redirect: "manual",
      signal,
    });
    const location = fetchRes.headers.get("location");
    if (fetchRes.status < 300 || fetchRes.status > 399 || !location) break;
    await fetchRes.body?.cancel();
    if (hop >= MAX_REDIRECTS) throw new Error("Failed to fetch URL: too many redirects.");
    url = new URL(location, url).toString();
  }

  if (!fetchRes.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${fetchRes.status} (${fetchRes.statusText})`);
  }

  const contentType = fetchRes.headers.get("content-type") || "";
  const rawBody = await readCappedText(fetchRes, MAX_BODY_BYTES);

  let cleanedContent = "";
  let extractedTitle = customTitle || suggestedTitle || "";

  if (
    sourceType === "github_raw" ||
    sourceType === "raw_text" ||
    contentType.includes("text/markdown") ||
    contentType.includes("text/plain")
  ) {
    cleanedContent = rawBody.trim();
  } else {
    // Extract metadata first (essential for Single Page Applications like Angular, React, Vue)
    const meta = extractHtmlMetadata(rawBody);
    const bodyContent = cleanHtmlToMarkdown(rawBody);

    if (meta.title && !customTitle) {
      extractedTitle = meta.title;
    }

    if (bodyContent && bodyContent.length >= 40) {
      cleanedContent = bodyContent;
    } else {
      // Client-Side Rendered (CSR) SPA fallback: assemble structured knowledge from meta tags
      const sections: string[] = [];
      if (meta.title) sections.push(`# ${meta.title}`);
      if (meta.description) sections.push(`## Description & Overview\n${meta.description}`);
      if (meta.keywords) sections.push(`## Topics & Keywords\n${meta.keywords}`);
      if (meta.jsonLd) sections.push(`## Structured Application Data\n\`\`\`json\n${meta.jsonLd}\n\`\`\``);
      if (bodyContent && bodyContent.length > 0) sections.push(`## Page Content\n${bodyContent}`);

      cleanedContent = sections.join("\n\n").trim();
    }
  }

  if (!cleanedContent || cleanedContent.length < 15) {
    throw new Error("Could not extract meaningful text from URL. Ensure the page is publicly accessible.");
  }

  const finalTitle = extractedTitle.length > 60 ? extractedTitle.substring(0, 60) + "..." : extractedTitle;

  return {
    url: rawUrl,
    normalizedUrl,
    sourceType,
    title: finalTitle || "Live Source Document",
    content: cleanedContent.substring(0, 45000), // Up to 45k chars (~11k tokens)
    charCount: Math.min(cleanedContent.length, 45000),
  };
}
