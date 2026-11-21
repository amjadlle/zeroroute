import { expect, it, vi } from "vitest";

// #46: raw D1 error bodies are logged, never put into thrown errors that a route could echo.
it("keeps D1 error details out of thrown errors", async () => {
  Object.assign(process.env, { CLOUDFLARE_ACCOUNT_ID: "acc", CLOUDFLARE_D1_DATABASE_ID: "db", CLOUDFLARE_D1_TOKEN: "tok" });
  vi.stubGlobal("fetch", vi.fn(async () => new Response("internal secret detail", { status: 500 })));
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { getDb } = await import("@/lib/db");

  const err = await getDb().execute("SELECT 1").catch((e: Error) => e);
  expect(err).toBeInstanceOf(Error);
  expect((err as Error).message).not.toContain("secret");
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining("D1"), "internal secret detail");
});
