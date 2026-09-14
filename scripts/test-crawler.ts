import { isSsrfSafeUrl, normalizeSourceUrl, cleanHtmlToMarkdown } from "../lib/crawler";

const BASE_URL = "http://localhost:3000";

async function runCrawlerTests() {
  console.log("===============================================================");
  console.log("🕷️ ZeroRoute Next.js SaaS: Web Crawler & RAG Ingestion Tests");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`, detail || "");
      failed++;
    }
  }

  // 1. SSRF Security Filters Test
  assert(!isSsrfSafeUrl("http://127.0.0.1:8080"), "Blocks IPv4 loopback (127.0.0.1)");
  assert(!isSsrfSafeUrl("http://localhost:3000"), "Blocks localhost");
  assert(!isSsrfSafeUrl("http://169.254.169.254/latest/meta-data/"), "Blocks AWS metadata IP");
  assert(!isSsrfSafeUrl("http://192.168.1.1"), "Blocks RFC 1918 Class C private IP");
  assert(!isSsrfSafeUrl("http://10.0.0.1/internal"), "Blocks RFC 1918 Class A private IP");
  assert(!isSsrfSafeUrl("file:///etc/passwd"), "Blocks non-HTTP protocol");
  assert(isSsrfSafeUrl("https://example.com/docs"), "Allows public https://example.com/docs");
  assert(isSsrfSafeUrl("https://raw.githubusercontent.com/user/repo/main/README.md"), "Allows public GitHub raw markdown");

  // 2. Normalization Tests
  const gh = normalizeSourceUrl("https://github.com/amjadlle/zeroroute/blob/main/README.md");
  assert(
    gh.normalizedUrl === "https://raw.githubusercontent.com/amjadlle/zeroroute/main/README.md" && gh.sourceType === "github_raw",
    "Auto-converts GitHub blob URL to raw markdown",
    gh
  );

  const gdocs = normalizeSourceUrl("https://docs.google.com/document/d/12345/edit?usp=sharing");
  assert(
    gdocs.normalizedUrl === "https://docs.google.com/document/d/12345/pub" && gdocs.sourceType === "google_docs",
    "Auto-converts Google Docs edit link to /pub",
    gdocs
  );

  // 3. HTML to Markdown Cleaner Test
  const sampleHtml = `
    <html>
      <head><title>Test Page</title><script>alert('bad')</script></head>
      <body>
        <nav><a href="/">Home</a></nav>
        <h1>ZeroRoute Cloud</h1>
        <p>ZeroRoute delivers <strong>zero cost</strong> multi-cloud routing across 10 free AI cloud networks.</p>
        <footer>Copyright 2026</footer>
      </body>
    </html>
  `;
  const cleaned = cleanHtmlToMarkdown(sampleHtml);
  assert(
    cleaned.includes("# ZeroRoute Cloud") &&
    cleaned.includes("**zero cost**") &&
    !cleaned.includes("alert") &&
    !cleaned.includes("Home") &&
    !cleaned.includes("Copyright"),
    "HTML-to-Markdown cleaner strips scripts, navs, footers and formats markdown headings",
    cleaned
  );

  // 4. Live API Crawl Test (/api/knowledge/crawl)
  try {
    // Signup a customer first
    const testEmail = `crawler_test_${Date.now()}@corp.com`;
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "password123",
        name: "Crawler Tester",
      }),
    });
    const setCookie = signupRes.headers.get("set-cookie") || "";
    const sessionCookie = setCookie.split(";")[0];

    // Crawl public GitHub README raw file
    const crawlRes = await fetch(`${BASE_URL}/api/knowledge/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        url: "https://raw.githubusercontent.com/amjadlle/zeroroute/main/README.md",
      }),
    });

    const crawlData = await crawlRes.json();
    assert(
      crawlRes.status === 200 && crawlData.success && crawlData.document?.char_count > 50,
      "POST /api/knowledge/crawl fetches and indexes live web resource",
      crawlData
    );

    // List knowledge documents to verify it is stored
    const listRes = await fetch(`${BASE_URL}/api/knowledge`, {
      headers: { Cookie: sessionCookie },
    });
    const listData = await listRes.json();
    assert(
      listRes.status === 200 && listData.documents?.some((d: any) => d.id === crawlData.document?.id),
      "GET /api/knowledge confirms crawled document is present in customer RAG corpus",
      { count: listData.documents?.length }
    );
  } catch (e) {
    assert(false, "API crawl test error", e);
  }

  console.log(`\n===============================================================`);
  console.log(`🎉 Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runCrawlerTests().catch(e => {
  console.error(e);
  process.exit(1);
});
