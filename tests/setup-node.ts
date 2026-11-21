// Every test file gets its own module graph (Vitest isolation), so getDb()
// returns a fresh in-memory libSQL database per file. Never touch D1 in tests.
process.env.DATABASE_URL = ":memory:";
delete process.env.CLOUDFLARE_D1_TOKEN;
delete process.env.USE_CLOUDFLARE_D1;
