import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { A, B, loginAs, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { POST } = await import("./route");
const { GET: me } = await import("../me/route");
const logout = (session?: string) =>
  POST(new NextRequest("http://localhost/api/auth/logout", { method: "POST", headers: session ? { cookie: `zr_session=${session}` } : {} }));
const sessions = async () =>
  Object.fromEntries((await (await testDb()).execute("SELECT id, session_token FROM customers")).rows.map((r) => [r.id, r.session_token]));

beforeEach(seedCustomers);

it("ends only the caller's session and clears the cookie", async () => {
  loginAs(A);
  expect((await me(req("/api/auth/me"))).status).toBe(200); // warm the session cache

  const res = await logout(A.session);
  expect(res.status).toBe(200);
  expect(res.cookies.get("zr_session")?.value).toBe("");
  expect(await sessions()).toEqual({ [A.id]: null, [B.id]: B.session });

  // The old cookie no longer works, even though it was cached a moment ago.
  expect((await me(req("/api/auth/me"))).status).toBe(401);
});

it("succeeds without a cookie and changes nothing", async () => {
  const res = await logout();
  expect(res.status).toBe(200);
  expect(await sessions()).toEqual({ [A.id]: A.session, [B.id]: B.session });
});
