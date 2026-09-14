import { getDb, initDb } from "../lib/db";

async function main() {
  await initDb();
  const db = getDb();

  const query1 = await db.execute({
    sql: "SELECT id FROM customers WHERE email = ? LIMIT 1",
    args: ["test@example.com"],
  });
  console.log("Query 1 result:", query1);

  const query2 = await db.execute({
    sql: "SELECT id FROM customers LIMIT 1",
    args: [],
  });
  console.log("Query 2 result:", query2);
}

main().catch(console.error);
