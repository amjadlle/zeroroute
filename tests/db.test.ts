import { expect, it } from "vitest";
import { testDb } from "./db";

it("creates the schema in an isolated in-memory database", async () => {
  const db = await testDb();
  const { rows } = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'");
  expect(rows).toHaveLength(1);
});
