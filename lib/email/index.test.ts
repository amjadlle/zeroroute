import { expect, it, vi } from "vitest";
import { sendWelcomeCredentialsEmail } from "./index";

it("HTML-escapes the name in the welcome email", async () => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "1" })));
  vi.stubGlobal("fetch", fetchMock);

  await sendWelcomeCredentialsEmail({ email: "a@example.com", name: '<a href="x">hi</a>', key: "k", botId: "b" });

  const { html } = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
  expect(html).toContain("&lt;a href=&quot;x&quot;&gt;hi&lt;/a&gt;");
  expect(html).not.toContain('<a href="x">');
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("never prints the email body in production when no email service is set", async () => {
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("EMAIL_WEBHOOK_URL", "");
  vi.stubEnv("NODE_ENV", "production");
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const err = vi.spyOn(console, "error").mockImplementation(() => {});

  await sendWelcomeCredentialsEmail({ email: "a@example.com", name: "A", key: "zr_live_secret123", botId: "b" });

  const printed = [...log.mock.calls, ...err.mock.calls].flat().join("\n");
  expect(printed).not.toContain("zr_live_secret123");
  log.mockRestore();
  err.mockRestore();
  vi.unstubAllEnvs();
});
