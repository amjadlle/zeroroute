import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDb } from "@/tests/db";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import { POST } from "./route";
import { GET as widgetConfig } from "../../widget/config/route";

const save = (body: object) =>
  POST(new NextRequest("http://localhost/api/customer/persona", {
    method: "POST",
    headers: { authorization: "Bearer zr_live_brand1" },
    body: JSON.stringify(body),
  }));
const config = async () =>
  (await (await widgetConfig(new Request("http://localhost/api/widget/config?bot_id=bot_brand1"))).json()).bot;

it("saves brand colour and logo, serves them to the widget, and keeps them when omitted", async () => {
  const db = await testDb();
  await db.execute(
    "INSERT INTO customers (id, key, email, bot_id, status, created_at, updated_at) VALUES ('cust_b', 'zr_live_brand1', 'b@example.com', 'bot_brand1', 'active', 0, 0)",
  );

  expect((await save({ brand_color: "#4F46E5", logo_url: "https://example.com/logo.png" })).status).toBe(200);
  expect(await config()).toMatchObject({ brandColor: "#4f46e5", logo: "https://example.com/logo.png" });

  expect((await save({ greeting: "Hello" })).status).toBe(200);
  expect(await config()).toMatchObject({ brandColor: "#4f46e5", greeting: "Hello" });

  expect((await save({ brand_color: "", logo_url: "" })).status).toBe(200);
  const cleared = await config();
  expect(cleared.brandColor).toBeUndefined();
  expect(cleared.logo).toBeUndefined();
});

it("rejects an invalid colour or logo without saving anything", async () => {
  const db = await testDb();
  for (const body of [{ brand_color: "red;x" }, { logo_url: "javascript:alert(1)" }]) {
    const res = await save({ ...body, greeting: "Changed" });
    expect(res.status).toBe(400);
  }
  const { rows } = await db.execute("SELECT greeting FROM customers WHERE id = 'cust_b'");
  expect(rows[0].greeting).toBe("Hello");
});
