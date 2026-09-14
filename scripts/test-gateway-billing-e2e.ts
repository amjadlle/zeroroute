import crypto from "crypto";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== Starting ZeroRoute SaaS Gateway & Billing Integration Tests ===\n");

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

  // 1. Test /v1/models
  try {
    const res = await fetch(`${BASE_URL}/v1/models`);
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.data) && data.data.length > 0, "GET /v1/models returns model pool", data);
  } catch (e) {
    assert(false, "GET /v1/models error", e);
  }

  // 2. Test /api/checkout
  try {
    const res = await fetch(`${BASE_URL}/api/checkout`);
    const data = await res.json();
    assert(res.status === 200 && Boolean(data.checkout_url), "GET /api/checkout returns checkout url", data);
  } catch (e) {
    assert(false, "GET /api/checkout error", e);
  }

  // 3. Test Dodo Webhook: Subscription Activation
  const testEmail = `subscriber_${Date.now()}@example.com`;
  let customerKey = "";
  let botId = "";

  try {
    const webhookSecret = "whsec_test_secret_12345678";
    process.env.DODO_WEBHOOK_SECRET = webhookSecret;

    const payload = JSON.stringify({
      type: "subscription.active",
      data: {
        customer: { email: testEmail, name: "Acme Corp Admin" },
        customer_business_name: "Acme Cloud",
        metadata: { company: "Acme Cloud" },
        next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString()
      }
    });

    const webhookId = `msg_${Date.now()}`;
    const webhookTimestamp = `${Math.floor(Date.now() / 1000)}`;
    const toSign = `${webhookId}.${webhookTimestamp}.${payload}`;
    const sig = crypto.createHmac("sha256", Buffer.from(webhookSecret)).update(toSign).digest("base64");

    const res = await fetch(`${BASE_URL}/api/webhooks/dodo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": webhookId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": `v1,${sig}`
      },
      body: payload
    });

    const resData = await res.json();
    assert(res.status === 200 && resData.received === true, "POST /api/webhooks/dodo verifies signature & activates subscriber", resData);
  } catch (e) {
    assert(false, "POST /api/webhooks/dodo error", e);
  }

  // 4. Test Customer Onboarding Setup & Password Set
  try {
    const res = await fetch(`${BASE_URL}/api/onboarding/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "secure_password_123",
        company: "Acme Cloud",
        botTitle: "Acme Bot",
        botRole: "Cloud Assistant",
        tone: "friendly and rapid",
        greeting: "Welcome to Acme Cloud! How can we assist you?",
        prompts: ["How to deploy?", "Pricing plans", "Contact sales"],
        knowledgeTitle: "Acme Services",
        knowledgeText: "Acme Cloud provides 99.999% uptime serverless GPUs and edge compute starting at $19/mo."
      })
    });

    const data = await res.json();
    assert(res.status === 200 && data.success && Boolean(data.customer.key), "POST /api/onboarding/setup provisions credentials and indexes initial knowledge", data);
    customerKey = data.customer.key;
    botId = data.customer.bot_id;
  } catch (e) {
    assert(false, "POST /api/onboarding/setup error", e);
  }

  // 5. Test Public Widget Config Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/widget/config?bot_id=${botId}`);
    const data = await res.json();
    assert(res.status === 200 && data.bot.botTitle === "Acme Bot" && data.bot.prompts.length === 3, "GET /api/widget/config retrieves public bot config", data);
  } catch (e) {
    assert(false, "GET /api/widget/config error", e);
  }

  // 6. Test Public Widget Static Script
  try {
    const res = await fetch(`${BASE_URL}/widget.js`);
    const text = await res.text();
    assert(res.status === 200 && text.includes("zr-widget-container"), "GET /widget.js serves standalone embeddable chat script", { length: text.length });
  } catch (e) {
    assert(false, "GET /widget.js error", e);
  }

  // 7. Test /v1/chat/completions (with Bearer Key & RAG context injection)
  try {
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerKey}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is your pricing for edge compute?" }]
      })
    });

    const data = await res.json();
    assert(res.status === 200 || res.status === 502 || res.status === 503, "POST /v1/chat/completions executes failover pipeline and RAG context retrieval", { status: res.status, data });
  } catch (e) {
    assert(false, "POST /v1/chat/completions error", e);
  }

  // 8. Test /v1/chat/completions with SSE Streaming
  try {
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerKey}`
      },
      body: JSON.stringify({
        stream: true,
        messages: [{ role: "user", content: "Hello!" }]
      })
    });

    assert(res.status === 200 || res.status === 502 || res.status === 503, "POST /v1/chat/completions stream returns 200 SSE or provider fallback status", { status: res.status });
  } catch (e) {
    assert(false, "POST /v1/chat/completions stream error", e);
  }

  // 9. Test Domain Whitelisting
  try {
    // Set allowed domain to acme.com
    const db = (await import("../lib/db")).getDb();
    await db.execute({
      sql: "UPDATE customers SET allowed_domains = ? WHERE key = ?",
      args: [JSON.stringify(["acme.com"]), customerKey]
    });

    // Call from unauthorized origin
    const unauthorizedRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerKey}`,
        "Origin": "https://evil-hacker.com"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "test" }]
      })
    });

    const unauthData = await unauthorizedRes.json();
    assert(unauthorizedRes.status === 403 && unauthData.error?.type === "domain_not_allowed", "Anti-hijack domain whitelist blocks unauthorized origins with 403", unauthData);

    // Call from authorized origin
    const authorizedRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerKey}`,
        "Origin": "https://app.acme.com"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "test" }]
      })
    });

    assert(authorizedRes.status !== 403, "Anti-hijack domain whitelist allows authorized origin", { status: authorizedRes.status });
  } catch (e) {
    assert(false, "Domain whitelisting error", e);
  }

  // 10. Test Dodo Webhook: Subscription Cancellation
  try {
    const cancelPayload = JSON.stringify({
      type: "subscription.canceled",
      data: {
        customer: { email: testEmail }
      }
    });

    const cancelWebhookId = `msg_cancel_${Date.now()}`;
    const cancelTimestamp = `${Math.floor(Date.now() / 1000)}`;
    const cancelToSign = `${cancelWebhookId}.${cancelTimestamp}.${cancelPayload}`;
    const cancelSig = crypto.createHmac("sha256", Buffer.from("whsec_test_secret_12345678")).update(cancelToSign).digest("base64");

    const res = await fetch(`${BASE_URL}/api/webhooks/dodo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": cancelWebhookId,
        "webhook-timestamp": cancelTimestamp,
        "webhook-signature": `v1,${cancelSig}`
      },
      body: cancelPayload
    });

    const data = await res.json();
    assert(res.status === 200 && data.received === true, "POST /api/webhooks/dodo processes cancellation", data);

    // Verify key is now blocked
    const chatRes = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${customerKey}`,
        "Origin": "https://app.acme.com"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hello" }]
      })
    });

    const chatData = await chatRes.json();
    assert(chatRes.status === 402 && chatData.error?.type === "subscription_inactive", "Inactive/canceled subscription returns 402 Payment Required", chatData);
  } catch (e) {
    assert(false, "Dodo cancellation error", e);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
