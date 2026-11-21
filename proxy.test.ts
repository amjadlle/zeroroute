import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-at-least-32-chars";

it("redirects /admin to login for a forged admin cookie", async () => {
  const req = new NextRequest("http://localhost/admin", { headers: { cookie: "zr_session=zr_admin_forged" } });
  const res = await proxy(req);
  expect(res.headers.get("location")).toContain("/login");
});

it("does not treat ?key= as signed in", async () => {
  const res = await proxy(new NextRequest("http://localhost/app/knowledge"));
  expect(res.headers.get("location")).toBe("http://localhost/login?redirect=%2Fapp%2Fknowledge");
});

it.each(["/app?key=zr_live_x", "/onboarding?key=zr_live_x&bot_id=b1&email=a%40b.c", "/app/usage?token=zr_live_x"])(
  "strips the key from %s",
  async (path) => {
    const res = await proxy(new NextRequest(`http://localhost${path}`));
    const location = new URL(res.headers.get("location")!);
    expect(location.search).not.toMatch(/key|token|email/);
    expect(location.pathname).toBe(path.split("?")[0]);
  },
);

it("lets a signed-in customer reach /app", async () => {
  const res = await proxy(new NextRequest("http://localhost/app/billing", { headers: { cookie: "zr_session=zr_sess_abc" } }));
  expect(res.headers.get("location")).toBeNull();
});
