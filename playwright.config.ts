import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

// Smoke suite against a production build (`next build && next start`) on a throwaway libSQL file.
// Values are set on process.env once in the runner; workers inherit them, so the tests read the
// same admin password the server got. CI may set any of them first.
const env = process.env;
const port = Number(env.E2E_PORT || 3736);
env.E2E_DB ??= `data/e2e-${Date.now()}.db`;
env.ADMIN_EMAIL ??= "admin@e2e.test";
env.ADMIN_PASSWORD ??= randomBytes(18).toString("hex");
env.ADMIN_SESSION_SECRET ??= randomBytes(32).toString("hex");
env.ROUTER_API_KEY ??= randomBytes(18).toString("hex");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!env.CI,
  retries: env.CI ? 1 : 0,
  reporter: env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next build && npx next start -H 127.0.0.1 -p ${port}`,
    url: `http://127.0.0.1:${port}/login`,
    // Never attach to some other server that happens to hold the port.
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "ignore",
    env: {
      DATABASE_URL: `file:${env.E2E_DB}`,
      ADMIN_EMAIL: env.ADMIN_EMAIL,
      ADMIN_PASSWORD: env.ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: env.ADMIN_SESSION_SECRET,
      ROUTER_API_KEY: env.ROUTER_API_KEY,
      APP_URL: `http://127.0.0.1:${port}`,
      // Empty beats any .env.local value (next only fills unset vars): no real email, payments or D1.
      RESEND_API_KEY: "",
      EMAIL_WEBHOOK_URL: "",
      DODO_API_KEY: "",
      DODO_WEBHOOK_SECRET: "",
      USE_CLOUDFLARE_D1: "",
      CLOUDFLARE_D1_TOKEN: "",
      DATABASE_AUTH_TOKEN: "",
    },
  },
});
