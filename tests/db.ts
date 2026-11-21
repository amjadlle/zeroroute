import { getDb, initDb } from "@/lib/db";

/** Schema-initialised in-memory database, fresh for each test file. */
export async function testDb() {
  await initDb();
  return getDb();
}
