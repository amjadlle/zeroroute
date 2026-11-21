import { afterEach, expect, it, vi } from "vitest";
import { testDb } from "@/tests/db";
import { ensureProviderConfigs, PROVIDER_CONFIG_TTL_MS, runtimeStateMap } from "./state";

async function saveGroq(enabled: boolean, order: number) {
  const db = await testDb();
  await db.execute({
    sql: `INSERT INTO provider_configs (id, name, enabled, priority, sort_order, primary_model, models, updated_at)
          VALUES ('groq', 'Groq', ?, ?, ?, 'm1', '["m1","m2"]', 0)
          ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled, sort_order = excluded.sort_order`,
    args: [enabled ? 1 : 0, order, order],
  });
}

afterEach(() => vi.restoreAllMocks());

// #41: a fresh instance must route with the saved admin settings, not the built-in defaults.
it("applies saved settings on a cold instance and refreshes them after the TTL", async () => {
  await saveGroq(false, 7);
  expect(runtimeStateMap.get("groq")!.enabled).toBe(true); // built-in default

  await ensureProviderConfigs();
  expect(runtimeStateMap.get("groq")).toMatchObject({ enabled: false, order: 7, models: ["m1", "m2"] });

  // Another instance saves a change: picked up only once the TTL has passed.
  await saveGroq(true, 2);
  await ensureProviderConfigs();
  expect(runtimeStateMap.get("groq")!.enabled).toBe(false);

  const later = Date.now() + PROVIDER_CONFIG_TTL_MS + 1;
  vi.spyOn(Date, "now").mockReturnValue(later);
  await ensureProviderConfigs();
  expect(runtimeStateMap.get("groq")).toMatchObject({ enabled: true, order: 2 });
});
