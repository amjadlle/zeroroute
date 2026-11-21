import { expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-at-least-32-chars";

it("redirects /admin to login for a forged admin cookie", async () => {
  const req = new NextRequest("http://localhost/admin", { headers: { cookie: "zr_session=zr_admin_forged" } });
  const res = await proxy(req);
  expect(res.headers.get("location")).toContain("/login");
});
