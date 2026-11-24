import { expect, test, type Page } from "@playwright/test";

// Customer console flows: add knowledge, save chatbot settings, test chat (gateway call mocked in the browser).
const pageErrors: Error[] = [];
test.beforeEach(async ({ page }) => {
  pageErrors.length = 0;
  page.on("pageerror", (err) => pageErrors.push(err));
  await signUp(page);
});
test.afterEach(() => expect(pageErrors.map(String)).toEqual([]));

async function signUp(page: Page) {
  await page.goto("/login?tab=signup");
  await page.getByLabel("Name").fill("E2E Shop");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("correct-horse-battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/app");
}

const openConsolePage = (page: Page, label: string) =>
  page.getByRole("navigation", { name: "Customer console", exact: true }).getByRole("link", { name: label }).click();

test("customer adds a text knowledge entry", async ({ page }) => {
  await openConsolePage(page, "Knowledge");
  await expect(page).toHaveURL("/app/knowledge");

  await page.getByRole("button", { name: "Add knowledge" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Add knowledge" });
  await dialog.getByRole("radio", { name: "Text" }).click();
  await dialog.getByLabel("Name").fill("Return policy");
  await dialog.getByLabel("Text").fill("Items can be returned within 30 days with a receipt.");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: /Added .Return policy.\./ })).toBeVisible();
  const table = page.getByRole("table", { name: "Knowledge sources" });
  await expect(table.getByRole("row").filter({ hasText: "Return policy" })).toBeVisible();

  // Stored server-side, not just in client state.
  await page.reload();
  await expect(page.getByRole("table", { name: "Knowledge sources" }).getByRole("row").filter({ hasText: "Return policy" })).toBeVisible();
});

test("customer saves chatbot settings", async ({ page }) => {
  await openConsolePage(page, "Chatbot");
  await expect(page).toHaveURL("/app/chatbot");

  await page.getByLabel("Name").fill("Shop helper");
  await page.getByLabel("Greeting").fill("Hello from the e2e shop!");
  await page.getByLabel("Instructions").fill("Answer briefly.");
  await page.getByRole("button", { name: "Add question" }).click();
  await page.getByRole("textbox", { name: "Suggested question 1", exact: true }).fill("Where is my order?");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("status").filter({ hasText: "Chatbot settings saved." })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Name")).toHaveValue("Shop helper");
  await expect(page.getByLabel("Greeting")).toHaveValue("Hello from the e2e shop!");
  await expect(page.getByLabel("Instructions")).toHaveValue("Answer briefly.");
  await expect(page.getByRole("textbox", { name: "Suggested question 1", exact: true })).toHaveValue("Where is my order?");
});

test("customer sends a test chat (model call mocked)", async ({ page }) => {
  // The browser calls the gateway, which calls the model provider server-side. Intercept the gateway call so no
  // provider is needed; the reply is an OpenAI-style SSE stream like the real one.
  let sent: { messages?: { role: string; content: string }[]; stream?: boolean } | undefined;
  await page.route("**/v1/chat/completions", async (route) => {
    sent = route.request().postDataJSON();
    const chunk = (content: string) =>
      `data: ${JSON.stringify({ provider: "mock", model: "mock-model", choices: [{ delta: { content } }] })}\n\n`;
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: chunk("Returns are accepted ") + chunk("within **30 days**.") + "data: [DONE]\n\n",
    });
  });

  await openConsolePage(page, "Chatbot");
  await expect(page).toHaveURL("/app/chatbot");

  await page.getByRole("textbox", { name: "Message" }).fill("What is your return policy?");
  await page.getByRole("button", { name: "Send" }).click();

  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log.getByText("What is your return policy?")).toBeVisible();
  await expect(log).toContainText("Returns are accepted within 30 days.");
  await expect(log.getByRole("strong")).toHaveText("30 days");
  await expect(log).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: "Copy reply" })).toBeVisible();

  expect(sent?.stream).toBe(true);
  expect(sent?.messages?.at(-1)).toEqual({ role: "user", content: "What is your return policy?" });
});
