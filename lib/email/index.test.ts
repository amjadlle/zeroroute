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
