import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));

import { lookup } from "node:dns/promises";
import {
  cleanHtmlToMarkdown, crawlSourceUrl, extractHtmlMetadata, isSsrfSafeUrl, normalizeSourceUrl,
} from "./index";

const lookupMock = vi.mocked(lookup) as unknown as ReturnType<typeof vi.fn>;
const fetchMock = vi.fn();
const TEXT = "Plain text body that is comfortably longer than the minimum length.";

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { location } });
}

function text(body: string | ReadableStream<Uint8Array>) {
  return new Response(body, { status: 200, headers: { "content-type": "text/plain" } });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  lookupMock.mockReset();
  // Every name resolves to a public address unless a test says otherwise.
  lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
});

describe("isSsrfSafeUrl", () => {
  it.each([
    "http://127.0.0.1:8080",
    "http://127.9.9.9",
    "http://2130706433", // decimal 127.0.0.1
    "http://0x7f000001", // hex
    "http://0x7f.1",
    "http://0177.0.0.1", // octal
    "http://017700000001",
    "http://0.0.0.0",
    "http://[::1]/",
    "http://[::]/",
    "http://[0:0:0:0:0:0:0:1]/",
    "http://[::ffff:127.0.0.1]/", // IPv4-mapped IPv6
    "http://[::ffff:169.254.169.254]/",
    "http://[::ffff:a9fe:a9fe]/",
    "http://[fe80::1]/",
    "http://[fd12:3456::1]/",
    "http://[fc00::1]/",
    "http://[ff02::1]/",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.0.1/internal",
    "http://172.16.0.1",
    "http://172.31.255.255",
    "http://192.168.1.1",
    "http://100.64.0.1", // CGNAT
    "http://100.127.255.254",
    "http://224.0.0.1",
    "http://255.255.255.255",
    "http://localhost:3000",
    "http://LOCALHOST",
    "http://localhost./",
    "http://app.localhost",
    "http://printer.local",
    "http://metadata.google.internal",
    "file:///etc/passwd",
    "ftp://example.com/file",
    "gopher://example.com",
    "javascript:alert(1)",
    "https://user:pass@example.com/",
    "https://user@example.com/",
    "not a url",
    "",
    `https://example.com/${"a".repeat(2100)}`,
  ])("blocks %s", (url) => {
    expect(isSsrfSafeUrl(url)).toBe(false);
  });

  it.each([
    "https://example.com/docs",
    "https://raw.githubusercontent.com/user/repo/main/README.md",
    "http://8.8.8.8/",
    "http://172.32.0.1/",
    "http://100.128.0.1/",
    "http://[2606:4700:4700::1111]/",
    "http://[::ffff:8.8.8.8]/",
  ])("allows %s", (url) => {
    expect(isSsrfSafeUrl(url)).toBe(true);
  });
});

describe("crawlSourceUrl", () => {
  it("blocks a redirect to a private IP without fetching it", async () => {
    fetchMock.mockResolvedValueOnce(redirect("http://169.254.169.254/latest/meta-data/"));
    await expect(crawlSourceUrl("https://example.com/r")).rejects.toThrow(/prohibited/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });

  it("blocks a name that resolves to 127.0.0.1", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(crawlSourceUrl("http://127.0.0.1.nip.io/")).rejects.toThrow(/prohibited/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks a name when any resolved address is private", async () => {
    lookupMock.mockResolvedValueOnce([
      { address: "93.184.216.34", family: 4 },
      { address: "fd00::1", family: 6 },
    ]);
    await expect(crawlSourceUrl("https://mixed.example.com/")).rejects.toThrow(/prohibited/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks a redirect to a name that resolves privately", async () => {
    fetchMock.mockResolvedValueOnce(redirect("http://internal.example.net/"));
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "10.0.0.5", family: 4 }]);
    await expect(crawlSourceUrl("https://example.com/r")).rejects.toThrow(/prohibited/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows a public redirect chain and checks every hop", async () => {
    fetchMock
      .mockResolvedValueOnce(redirect("https://cdn.example.org/a"))
      .mockResolvedValueOnce(redirect("/final.txt")) // relative Location
      .mockResolvedValueOnce(text(TEXT));
    const res = await crawlSourceUrl("https://example.com/start");
    expect(res.content).toBe(TEXT);
    expect(res.normalizedUrl).toBe("https://example.com/start");
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "https://example.com/start",
      "https://cdn.example.org/a",
      "https://cdn.example.org/final.txt",
    ]);
    expect(lookupMock.mock.calls.map((c) => c[0])).toEqual(["example.com", "cdn.example.org", "cdn.example.org"]);
  });

  it("gives up after too many redirects", async () => {
    fetchMock.mockImplementation(async () => redirect("https://example.com/loop"));
    await expect(crawlSourceUrl("https://example.com/loop")).rejects.toThrow(/too many redirects/);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("stops reading an oversize body at the byte cap", async () => {
    let pulls = 0;
    const chunk = new TextEncoder().encode("a".repeat(64 * 1024));
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(chunk);
      },
    });
    fetchMock.mockResolvedValueOnce(text(endless));
    const res = await crawlSourceUrl("https://example.com/big.txt");
    expect(res.charCount).toBe(45000);
    expect(pulls).toBeLessThan(40); // 2 MiB cap / 64 KiB chunks, plus stream read-ahead
  });

  it("reports non-2xx responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 404, statusText: "Not Found" }));
    await expect(crawlSourceUrl("https://example.com/missing")).rejects.toThrow(/HTTP 404/);
  });
});

describe("normalizeSourceUrl", () => {
  it("rewrites Google Docs edit links to the published view", () => {
    expect(normalizeSourceUrl("https://docs.google.com/document/d/abc123/edit?usp=sharing")).toEqual({
      normalizedUrl: "https://docs.google.com/document/d/abc123/pub",
      sourceType: "google_docs",
      suggestedTitle: "Google Doc",
    });
  });

  it("rewrites GitHub blob links to raw", () => {
    expect(normalizeSourceUrl("https://github.com/acme/repo/blob/main/docs/My%20Guide.md")).toEqual({
      normalizedUrl: "https://raw.githubusercontent.com/acme/repo/main/docs/My%20Guide.md",
      sourceType: "github_raw",
      suggestedTitle: "My Guide.md",
    });
  });

  it("detects Notion, raw text files and plain websites, adding https://", () => {
    expect(normalizeSourceUrl("acme.notion.site/Help-123").sourceType).toBe("notion");
    expect(normalizeSourceUrl("https://example.com/files/faq.txt")).toMatchObject({
      sourceType: "raw_text",
      suggestedTitle: "faq.txt",
    });
    expect(normalizeSourceUrl("  www.example.com  ")).toEqual({
      normalizedUrl: "https://www.example.com",
      sourceType: "website",
      suggestedTitle: "example.com",
    });
  });
});

describe("cleanHtmlToMarkdown", () => {
  it("drops scripts and chrome, keeps headings, emphasis and lists", () => {
    const html =
      "<html><head><title>x</title></head><body><nav>menu</nav><script>evil()</script>" +
      "<h1>Title</h1><p>Hello <strong>world</strong> &amp; friends</p><ul><li>One</li></ul></body></html>";
    const md = cleanHtmlToMarkdown(html);
    expect(md).toContain("# Title");
    expect(md).toContain("Hello **world** & friends");
    expect(md).toContain("- One");
    expect(md).not.toMatch(/evil|menu|<|>/);
  });
});

describe("extractHtmlMetadata", () => {
  it("reads title, description, keywords and JSON-LD", () => {
    const html =
      "<title>Pricing - Google Docs</title>" +
      '<meta content="Cheap plans" property="og:description">' +
      '<meta name="keywords" content="ai, chat">' +
      '<script type="application/ld+json">{"@type":"Product"}</script>';
    expect(extractHtmlMetadata(html)).toEqual({
      title: "Pricing",
      description: "Cheap plans",
      keywords: "ai, chat",
      jsonLd: JSON.stringify({ "@type": "Product" }, null, 2),
    });
  });

  it("ignores malformed JSON-LD", () => {
    expect(extractHtmlMetadata('<script type="application/ld+json">{oops</script>')).toEqual({});
  });
});
