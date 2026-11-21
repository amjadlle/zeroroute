import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, req, seedCustomers } from "@/tests/auth";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET } = await import("./route");
const me = (bearer?: string) => GET(req("/api/auth/me", { bearer }));

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`UPDATE customers SET password_hash = 'h', password_salt = 's'`);
});

it("returns 401 without a session or key", async () => {
  expect((await me()).status).toBe(401);
});

it("returns 401 for an unknown session cookie", async () => {
  loginAs({ session: "zr_sess_forged" });
  expect((await me()).status).toBe(401);
});

it("returns the session owner, even when a bearer key for someone else is sent", async () => {
  loginAs(A);
  expect((await (await me(B.key)).json()).customer).toMatchObject({ id: A.id, email: A.email });
});

it("accepts an API key, but not a session token or id, as a bearer token", async () => {
  expect((await (await me(B.key)).json()).customer.id).toBe(B.id);
  for (const token of [B.session, B.id, B.bot]) expect((await me(token)).status).toBe(401);
});

it("never returns password or session material", async () => {
  loginAs(A);
  const { customer } = await (await me()).json();
  for (const field of ["password_hash", "password_salt", "session_token"]) expect(customer).not.toHaveProperty(field);
});
