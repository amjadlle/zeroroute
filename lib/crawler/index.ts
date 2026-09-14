export type LiveSourceType = "google_docs" | "github_raw" | "notion" | "website" | "raw_text";

export interface CrawlResult {
  url: string;
  normalizedUrl: string;
  sourceType: LiveSourceType;
  title: string;
  content: string;
  charCount: number;
}

/**
 * Checks for private / loopback / cloud metadata IP addresses to prevent SSRF.
 */
export function isSsrfSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.startsWith("127.") ||
      host === "::1" ||
      host.startsWith("169.254.") || // Cloud metadata
      host.startsWith("10.") || // RFC 1918 Class A
      host.startsWith("192.168.") || // RFC 1918 Class C
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) || // RFC 1918 Class B
      host.endsWith(".internal") ||
      host.endsWith(".local") ||
      host.endsWith(".localhost") ||
      /^\d+$/.test(host) || // Decimal IP
      /^0x[0-9a-f]+$/i.test(host) // Hex IP
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
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
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n\n# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n")
    .replace(/<h[4-6][^>]*>(.*?)<\/h[4-6]>/gi, "\n\n#### $1\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n\n$1")
    .replace(/<tr[^>]*>(.*?)<\/tr>/gi, "\n$1")
    .replace(/<td[^>]*>(.*?)<\/td>/gi, " | $1")
    .replace(/<th[^>]*>(.*?)<\/th>/gi, " | **$1**")
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

/**
 * Fetches and parses a single live URL across any of the 5 supported source types.
 */
export async function crawlSourceUrl(rawUrl: string, customTitle?: string): Promise<CrawlResult> {
  const { normalizedUrl, sourceType, suggestedTitle } = normalizeSourceUrl(rawUrl);

  if (!isSsrfSafeUrl(normalizedUrl)) {
    throw new Error("Access to private, loopback, or internal addresses is prohibited.");
  }

  const fetchRes = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeroRoute-Knowledge-Crawler/2.0",
      Accept: "text/html,text/markdown,text/plain,application/json,*/*",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!fetchRes.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${fetchRes.status} (${fetchRes.statusText})`);
  }

  const contentType = fetchRes.headers.get("content-type") || "";
  const rawBody = await fetchRes.text();

  let cleanedContent = "";

  if (
    sourceType === "github_raw" ||
    sourceType === "raw_text" ||
    contentType.includes("text/markdown") ||
    contentType.includes("text/plain")
  ) {
    cleanedContent = rawBody.trim();
  } else {
    cleanedContent = cleanHtmlToMarkdown(rawBody);
  }

  if (!cleanedContent || cleanedContent.length < 15) {
    throw new Error("Could not extract meaningful text from URL. Ensure the page is publicly accessible.");
  }

  // Extract page title from HTML <title> tag if not provided
  let extractedTitle = customTitle || suggestedTitle || "";
  if (!customTitle) {
    const titleMatch = rawBody.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const docTitle = titleMatch[1].replace(/ - Google Docs$/i, "").replace(/ \| Notion$/i, "").trim();
      if (docTitle.length > 2) {
        extractedTitle = docTitle;
      }
    }
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
