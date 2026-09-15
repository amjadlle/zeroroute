import { getDb, initDb } from "../lib/db";

async function main() {
  const db = getDb();
  console.log("Adding all columns to D1 customers table...");

  const colsToAdd = [
    "ALTER TABLE customers ADD COLUMN period_start INTEGER;",
    "ALTER TABLE customers ADD COLUMN period_end INTEGER;",
    "ALTER TABLE customers ADD COLUMN id TEXT;",
    "ALTER TABLE customers ADD COLUMN password_hash TEXT;",
    "ALTER TABLE customers ADD COLUMN password_salt TEXT;",
    "ALTER TABLE customers ADD COLUMN session_token TEXT;",
    "ALTER TABLE customers ADD COLUMN bot_id TEXT;",
    "ALTER TABLE customers ADD COLUMN allowed_domains TEXT DEFAULT '[]';",
    "ALTER TABLE customers ADD COLUMN bot_title TEXT DEFAULT 'ZeroRoute AI';",
    "ALTER TABLE customers ADD COLUMN bot_role TEXT DEFAULT 'AI Assistant';",
    "ALTER TABLE customers ADD COLUMN tone TEXT DEFAULT 'helpful and concise';",
    "ALTER TABLE customers ADD COLUMN greeting TEXT DEFAULT 'Hi there! How can I help you today?';",
    "ALTER TABLE customers ADD COLUMN prompts TEXT DEFAULT '[]';",
    "ALTER TABLE customers ADD COLUMN persona TEXT;",
    "ALTER TABLE customers ADD COLUMN status TEXT DEFAULT 'active';",
    "ALTER TABLE customers ADD COLUMN subscription_expires INTEGER;",
    "ALTER TABLE customers ADD COLUMN monthly_requests INTEGER DEFAULT 0;",
    "ALTER TABLE customers ADD COLUMN monthly_limit INTEGER DEFAULT 10000;",
  ];

  for (const sql of colsToAdd) {
    try {
      await db.execute(sql);
      console.log("Executed:", sql);
    } catch (e: any) {
      // Ignore if already exists
    }
  }

  await db.execute("UPDATE customers SET id = key WHERE id IS NULL OR id = '';");
  console.log("✅ Backfilled id on existing customers");

  await initDb();
  console.log("✅ D1 Migration finished successfully!");
}

main().catch(console.error);
