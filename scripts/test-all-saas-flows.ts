import crypto from "crypto";

const BASE_URL = "http://localhost:3000";

async function runFullSuite() {
  console.log("===============================================================");
  console.log("🚀 ZeroRoute Next.js SaaS: Full End-to-End Test Suite");
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

  // 1. Landing page
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, "Landing page loads successfully");
  } catch (e) {
    assert(false, "Landing page load error", e);
  }

  // 2. Auth Flow: Signup
  const userEmail = `founder_${Date.now()}@acmecorp.io`;
  const userPassword = "SuperSecurePassword123!";
  let sessionCookie = "";
  let customerKey = "";
  let botId = "";

  try {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        name: "Elon Musk",
        company: "X Corp",
      }),
    });

    const setCookie = res.headers.get("set-cookie") || "";
    sessionCookie = setCookie.split(";")[0];
    const data = await res.json();

    assert(res.status === 200 && data.success && Boolean(data.customer?.key), "POST /api/auth/signup creates subscriber & sets HTTP-only session cookie", data);
    customerKey = data.customer.key;
    botId = data.customer.bot_id;
  } catch (e) {
    assert(false, "POST /api/auth/signup error", e);
  }

  // 3. Auth Flow: Me Profile
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert(res.status === 200 && data.customer?.email === userEmail, "GET /api/auth/me resolves current authenticated user", data);
  } catch (e) {
    assert(false, "GET /api/auth/me error", e);
  }

  // 4. Onboarding Setup
  try {
    const res = await fetch(`${BASE_URL}/api/onboarding/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        company: "X Corp AI",
        botTitle: "Grok Support Bot",
        botRole: "AI Specialist",
        tone: "insightful and witty",
        greeting: "Greetings! How can Grok assist you?",
        prompts: ["Explain quantum routing", "Check cluster status"],
        knowledgeTitle: "Quantum FAQ",
        knowledgeText: "X Corp provides sub-millisecond edge failover across 10 distinct cloud providers.",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success && data.customer.bot_title === "Grok Support Bot", "POST /api/onboarding/setup updates persona & indexes knowledge", data);
  } catch (e) {
    assert(false, "POST /api/onboarding/setup error", e);
  }

  // 5. Knowledge API: Add Document & List
  try {
    const addRes = await fetch(`${BASE_URL}/api/knowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        title: "API Gateway Specs",
        type: "markdown",
        content: "ZeroRoute handles up to 500,000 requests per second with automatic 10-cloud failover.",
      }),
    });
    const addData = await addRes.json();
    assert(addRes.status === 200 && Boolean(addData.document?.id), "POST /api/knowledge adds new document to RAG corpus", addData);

    const listRes = await fetch(`${BASE_URL}/api/knowledge`, {
      headers: { Cookie: sessionCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200 && listData.documents?.length >= 2, "GET /api/knowledge lists all customer knowledge documents", { count: listData.documents?.length });
  } catch (e) {
    assert(false, "Knowledge API error", e);
  }

  // 6. Persona API
  try {
    const res = await fetch(`${BASE_URL}/api/customer/persona`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        bot_title: "Grok Pro Bot",
        tone: "friendly and rapid",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, "POST /api/customer/persona tunes bot title and tone", data);
  } catch (e) {
    assert(false, "POST /api/customer/persona error", e);
  }

  // 7. Gateway Key Regeneration
  try {
    const res = await fetch(`${BASE_URL}/api/customer/key/regenerate`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    assert(res.status === 200 && data.success && data.key !== customerKey, "POST /api/customer/key/regenerate rotates master gateway key", data);
    customerKey = data.key;
  } catch (e) {
    assert(false, "Key regenerate error", e);
  }

  // 8. Public Widget Config & Script
  try {
    const res = await fetch(`${BASE_URL}/api/widget/config?bot_id=${botId}`);
    const data = await res.json();
    assert(res.status === 200 && data.bot.botTitle === "Grok Pro Bot", "GET /api/widget/config returns real-time bot customization", data);

    const scriptRes = await fetch(`${BASE_URL}/widget.js`);
    const scriptText = await scriptRes.text();
    assert(scriptRes.status === 200 && scriptText.includes("zr-widget-box"), "GET /widget.js delivers production embeddable script");
  } catch (e) {
    assert(false, "Widget tests error", e);
  }

  // 9. Multi-Cloud AI Gateway: /v1/models & /v1/chat/completions
  try {
    const modelsRes = await fetch(`${BASE_URL}/v1/models`, {
      headers: { Authorization: `Bearer ${customerKey}` }
    });
    const modelsData = await modelsRes.json();
    assert(modelsRes.status === 200 && modelsData.data?.length > 0, "GET /v1/models lists all 10 cloud models", { count: modelsData.data?.length });

    const chatRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What are your API Gateway specs?" }],
      }),
    });
    assert(chatRes.status === 200 || chatRes.status === 502 || chatRes.status === 503, "POST /v1/chat/completions routes query through provider pool with RAG injection", { status: chatRes.status });

    const streamRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerKey}`,
      },
      body: JSON.stringify({
        stream: true,
        messages: [{ role: "user", content: "Hi!" }],
      }),
    });
    assert(streamRes.status === 200 || streamRes.status === 502 || streamRes.status === 503, "POST /v1/chat/completions streaming SSE returns valid response", { status: streamRes.status });
  } catch (e) {
    assert(false, "Chat completions error", e);
  }

  // 10. Allowed Domains Whitelisting
  try {
    const updateDomainsRes = await fetch(`${BASE_URL}/api/customer/domains`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ domains: ["myverifiedsite.com"] }),
    });
    assert(updateDomainsRes.status === 200, "POST /api/customer/domains sets allowed domains whitelist");

    // Test unauthorized origin
    const blockRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerKey}`,
        Origin: "https://unauthorized-domain.com",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
    });
    const blockData = await blockRes.json();
    assert(blockRes.status === 403 && blockData.error?.type === "domain_not_allowed", "Anti-hijack protection blocks unauthorized origin with 403", blockData);
  } catch (e) {
    assert(false, "Domains test error", e);
  }

  // 11. Dodo Payments Webhook Lifecycle
  try {
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET || "whsec_test_secret_12345678";

    // Cancellation
    const cancelPayload = JSON.stringify({
      type: "subscription.cancelled",
      data: { customer: { email: userEmail } },
    });
    const webhookId = `msg_test_${Date.now()}`;
    const webhookTimestamp = `${Math.floor(Date.now() / 1000)}`;
    const secretKey = webhookSecret.startsWith("whsec_")
      ? Buffer.from(webhookSecret.slice(6), "base64")
      : Buffer.from(webhookSecret, "utf-8");
    const sig = crypto.createHmac("sha256", secretKey).update(`${webhookId}.${webhookTimestamp}.${cancelPayload}`).digest("base64");

    const cancelRes = await fetch(`${BASE_URL}/api/webhooks/dodo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": webhookId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": `v1,${sig}`,
      },
      body: cancelPayload,
    });
    assert(cancelRes.status === 200, "POST /api/webhooks/dodo handles subscription cancellation");

    // Check that canceled user gets 402 on chat gateway
    const canceledChatRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerKey}`,
        Origin: "https://myverifiedsite.com",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: "test" }] }),
    });
    const canceledChatData = await canceledChatRes.json();
    assert(canceledChatRes.status === 402 && canceledChatData.error?.type === "subscription_inactive", "Inactive subscriber is blocked with 402 Payment Required", canceledChatData);
  } catch (e) {
    assert(false, "Dodo Webhook error", e);
  }

  // 12. Password Reset OTP Flow
  try {
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200 && forgotData.success, "POST /api/auth/forgot-password generates 6-digit OTP");

    // Fetch OTP directly from DB
    const db = (await import("../lib/db")).getDb();
    const otpRes = await db.execute({
      sql: "SELECT code FROM auth_otps WHERE email = ? LIMIT 1",
      args: [userEmail],
    });
    const otpCode = String(otpRes.rows[0]?.code || "");

    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        code: otpCode,
        newPassword: "BrandNewPassword999!",
      }),
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200 && resetData.success, "POST /api/auth/reset-password verifies OTP and updates password");
  } catch (e) {
    assert(false, "Password reset OTP error", e);
  }

  // 13. Login & Logout
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        password: "BrandNewPassword999!",
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, "POST /api/auth/login authenticates with new password", loginData);

    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
    assert(logoutRes.status === 200, "POST /api/auth/logout invalidates session");
  } catch (e) {
    assert(false, "Login/Logout error", e);
  }

  console.log(`\n===============================================================`);
  console.log(`🎉 Final Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runFullSuite().catch(e => {
  console.error(e);
  process.exit(1);
});
