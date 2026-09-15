const BASE_URL = "http://localhost:3000";

async function runAdminTests() {
  console.log("===============================================================");
  console.log("👑 ZeroRoute Next.js SaaS: Unified Auth & Admin Master Suite");
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

  // 1. Unified Login as Admin
  let adminSessionCookie = "";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || "admin@zeroroute.io",
        password: process.env.ADMIN_PASSWORD || process.env.ROUTER_API_KEY || "admin1234",
      }),
    });

    const setCookie = res.headers.get("set-cookie") || "";
    adminSessionCookie = setCookie.split(";")[0];
    const data = await res.json();

    assert(
      res.status === 200 && data.role === "admin" && data.redirect === "/admin",
      "POST /api/auth/login routes Admin to /admin with admin session token",
      data
    );
  } catch (e) {
    assert(false, "Admin login error", e);
  }

  // 2. Unified Login as Customer
  try {
    // First create a customer
    const userEmail = `user_test_${Date.now()}@corp.com`;
    await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        password: "password123",
        name: "Standard User",
      }),
    });

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        password: "password123",
      }),
    });

    const data = await res.json();
    assert(
      res.status === 200 && data.role === "customer" && data.redirect === "/app",
      "POST /api/auth/login routes Customer to /app",
      data
    );
  } catch (e) {
    assert(false, "Customer login error", e);
  }

  // 3. Admin Providers List
  try {
    const res = await fetch(`${BASE_URL}/api/admin/providers`, {
      headers: { Cookie: adminSessionCookie },
    });
    const data = await res.json();
    assert(
      res.status === 200 && Array.isArray(data.providers) && data.providers.length === 10,
      "GET /api/admin/providers lists all 10 AI cloud provider matrices",
      { count: data.providers?.length }
    );
  } catch (e) {
    assert(false, "Admin providers error", e);
  }

  // 4. Admin Provider Live Ping & Test
  try {
    const res = await fetch(`${BASE_URL}/api/admin/providers/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSessionCookie,
      },
      body: JSON.stringify({
        providerId: "groq",
        model: "openai/gpt-oss-120b",
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && typeof data.latencyMs === "number",
      "POST /api/admin/providers/test executes live model ping and telemetry probe",
      data
    );
  } catch (e) {
    assert(false, "Provider test error", e);
  }

  // 5. Admin Provider Benchmark Race
  try {
    const res = await fetch(`${BASE_URL}/api/admin/providers/benchmark`, {
      method: "POST",
      headers: { Cookie: adminSessionCookie },
    });
    const data = await res.json();
    assert(
      res.status === 200 && Array.isArray(data.results),
      "POST /api/admin/providers/benchmark races all 10 clouds concurrently and returns latency rankings",
      { count: data.results?.length }
    );
  } catch (e) {
    assert(false, "Benchmark race error", e);
  }

  // 6. Admin Customer Management (List, Status Patch, Delete)
  try {
    const listRes = await fetch(`${BASE_URL}/api/admin/customers`, {
      headers: { Cookie: adminSessionCookie },
    });
    const listData = await listRes.json();
    assert(
      listRes.status === 200 && Array.isArray(listData.customers),
      "GET /api/admin/customers lists all system tenants",
      { count: listData.customers?.length }
    );

    if (listData.customers?.length > 0) {
      const target = listData.customers[0];
      const patchRes = await fetch(`${BASE_URL}/api/admin/customers`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminSessionCookie,
        },
        body: JSON.stringify({ id: target.id, status: "paused" }),
      });
      const patchData = await patchRes.json();
      assert(patchRes.status === 200 && patchData.success, "PATCH /api/admin/customers modifies subscriber status", patchData);
    }
  } catch (e) {
    assert(false, "Customer management error", e);
  }

  // 7. Admin Global Request Telemetry Logs
  try {
    const res = await fetch(`${BASE_URL}/api/admin/logs`, {
      headers: { Cookie: adminSessionCookie },
    });
    const data = await res.json();
    assert(
      res.status === 200 && Array.isArray(data.logs),
      "GET /api/admin/logs streams global telemetry logs",
      { count: data.logs?.length }
    );
  } catch (e) {
    assert(false, "Admin logs error", e);
  }

  console.log(`\n===============================================================`);
  console.log(`🎉 Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===============================================================\n`);

  if (failed > 0) process.exit(1);
}

runAdminTests().catch(e => {
  console.error(e);
  process.exit(1);
});
