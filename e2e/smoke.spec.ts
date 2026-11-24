import { expect, test, type Page } from "@playwright/test";

// Fail on any uncaught exception in the page, not only on missing headings.
const pageErrors: Error[] = [];
test.beforeEach(({ page }) => {
  pageErrors.length = 0;
  page.on("pageerror", (err) => pageErrors.push(err));
});
test.afterEach(() => expect(pageErrors.map(String)).toEqual([]));

const h1 = (page: Page) => page.getByRole("heading", { level: 1 });

async function visitAll(page: Page, nav: string, pages: [label: string, path: string, heading: RegExp][]) {
  for (const [label, path, heading] of pages) {
    await page.getByRole("navigation", { name: nav, exact: true }).getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(h1(page)).toHaveText(heading);
  }
}

const CUSTOMER_PAGES: [string, string, RegExp][] = [
  ["Chatbot", "/app/chatbot", /^Chatbot$/],
  ["Knowledge", "/app/knowledge", /^Knowledge$/],
  ["Install", "/app/install", /^Install$/],
  ["Usage", "/app/usage", /^Usage$/],
  ["Billing", "/app/billing", /^Billing$/],
  ["Home", "/app", /^(Welcome to ZeroRoute|Home)$/],
];

const ADMIN_PAGES: [string, string, RegExp][] = [
  ["Providers", "/admin/providers", /^Providers$/],
  ["Customers", "/admin/customers", /^Customers$/],
  ["Knowledge", "/admin/knowledge", /^Knowledge$/],
  ["Request log", "/admin/logs", /^Request log$/],
  ["Playground", "/admin/playground", /^Playground$/],
  ["Overview", "/admin", /^Overview$/],
];

test("signed-out visitors are sent to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin$/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fapp$/);
});

test("customer: sign up, console pages, theme, no admin, sign out", async ({ page }) => {
  await page.goto("/login?tab=signup");
  await page.getByLabel("Name").fill("E2E Shop");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.test`);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("correct-horse-battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();

  // New accounts land in the setup wizard, with the signup name as the company.
  await expect(page).toHaveURL("/onboarding");
  await expect(page.getByLabel(/Company or project name/)).toHaveValue("E2E Shop");
  await page.getByLabel("Website").fill("https://e2e-shop.example/home");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("textbox", { name: /^Name/ })).toHaveValue("E2E Shop");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("link", { name: "Go to your console" }).click();
  await expect(page).toHaveURL("/app");
  // Onboarding counts on Home: the name is set and the website is an allowed domain.
  await expect(page.getByText("Name your chatbot (done)")).toBeAttached();
  await expect(page.getByText("Put it on your website (done)")).toBeAttached();
  await expect(page.getByRole("navigation", { name: "Customer console", exact: true })).toBeVisible();
  await expect(h1(page)).toHaveText(/^(Welcome to ZeroRoute|Home)$/);
  await expect(page.getByRole("navigation", { name: "Switch console" })).toHaveCount(0);

  await visitAll(page, "Customer console", CUSTOMER_PAGES);

  // System -> Light -> Dark, and the choice survives a reload.
  const html = page.locator("html");
  await page.getByRole("button", { name: /^Theme: System/ }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /^Theme: Light/ }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: /^Theme: Dark/ })).toBeVisible();

  // A customer session never opens the admin console.
  await page.goto("/admin");
  await expect(page).toHaveURL("/app");
  await expect(page.getByRole("navigation", { name: "Admin console" })).toHaveCount(0);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/login");
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fapp$/);
});

test("admin: sign in and every admin page renders", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(process.env.ADMIN_PASSWORD!);
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/admin");
  await expect(h1(page)).toHaveText("Overview");
  await visitAll(page, "Admin console", ADMIN_PAGES);
});
