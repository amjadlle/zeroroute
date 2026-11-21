import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { signAdminSession } from "@/lib/auth/admin-session";

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

describe("role redirects", () => {
  const req = (path: string, cookie?: string) =>
    new NextRequest(`http://localhost${path}`, cookie ? { headers: { cookie: `zr_session=${cookie}` } } : undefined);
  const location = async (path: string, cookie?: string) => (await proxy(req(path, cookie))).headers.get("location");

  it("sends anonymous visitors of /admin and /app to login with a redirect back", async () => {
    expect(await location("/admin/providers")).toBe("http://localhost/login?redirect=%2Fadmin");
    expect(await location("/app")).toBe("http://localhost/login?redirect=%2Fapp");
  });

  it("keeps customers out of /admin", async () => {
    expect(await location("/admin", "zr_sess_abc")).toBe("http://localhost/login?redirect=%2Fadmin");
  });

  it("lets a verified admin into /admin and /app", async () => {
    const token = (await signAdminSession())!;
    expect(await location("/admin/customers", token)).toBeNull();
    expect(await location("/app", token)).toBeNull();
  });

  it("rejects an admin token signed with another secret", async () => {
    const token = (await signAdminSession())!;
    process.env.ADMIN_SESSION_SECRET = "a-different-secret-that-is-also-32-chars-long";
    try {
      expect(await location("/admin", token)).toBe("http://localhost/login?redirect=%2Fadmin");
    } finally {
      process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-at-least-32-chars";
    }
  });

  it("bounces signed-in users away from /login by role", async () => {
    expect(await location("/login", (await signAdminSession())!)).toBe("http://localhost/admin");
    expect(await location("/login", "zr_sess_abc")).toBe("http://localhost/app");
    expect(await location("/login")).toBeNull();
  });

  it("leaves public pages and secret-looking params outside /app alone", async () => {
    expect(await location("/")).toBeNull();
    expect(await location("/pricing?key=abc")).toBeNull();
  });
});
