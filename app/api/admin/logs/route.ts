import { NextResponse } from "next/server";
import { resolveAuth } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
/** Rolling 24-hour buckets behind the Overview trends: the last 7 days plus the 7 before, to compare. */
const TREND_DAYS = 14;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const origin = url.searchParams.get("origin")?.trim();
    const provider = url.searchParams.get("provider")?.trim();
    const statusFilter = url.searchParams.get("status")?.trim();
    const search = url.searchParams.get("search")?.trim();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "150", 10), 1), 500);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

    const db = getDb();

    // 1. Build Dynamic Filter Clauses & Parameters
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (origin && origin !== "all") {
      conditions.push("origin = ?");
      params.push(origin);
    }

    if (provider && provider !== "all") {
      conditions.push("provider = ?");
      params.push(provider.toLowerCase());
    }

    if (statusFilter === "success") {
      conditions.push("status >= 200 AND status < 300");
    } else if (statusFilter === "error") {
      conditions.push("(status < 200 OR status >= 300)");
    }

    const customerKey = url.searchParams.get("customer_key")?.trim();
    if (customerKey) {
      conditions.push("customer_key = ?");
      params.push(customerKey);
    }

    if (search) {
      conditions.push("(prompt_preview LIKE ? OR response_preview LIKE ? OR model LIKE ? OR id LIKE ? OR customer_key LIKE ?)");
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 2. Fetch Filtered Logs + Aggregation Metrics concurrently in a single batch
    const now = Date.now();
    const [logsResult, statsResult, originsResult, providersResult, dailyResult] = await Promise.all([
      db.execute({
        sql: `
          SELECT 
            id, customer_key, timestamp, origin, prompt_preview, response_preview,
            provider, model, latency_ms, status, is_stream, is_cache_hit, failovers,
            prompt_tokens, completion_tokens, total_tokens
          FROM request_logs 
          ${whereClause}
          ORDER BY timestamp DESC 
          LIMIT ? OFFSET ?
        `,
        args: [...params, limit, offset]
      }),
      db.execute(`
        SELECT 
          COUNT(*) as total_count,
          AVG(latency_ms) as avg_latency,
          SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN is_cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits
        FROM request_logs
      `),
      db.execute(`
        SELECT origin, COUNT(*) as count 
        FROM request_logs 
        WHERE origin IS NOT NULL AND origin != '' 
        GROUP BY origin 
        ORDER BY count DESC 
        LIMIT 50
      `),
      db.execute(`
        SELECT provider, COUNT(*) as count 
        FROM request_logs 
        GROUP BY provider 
        ORDER BY count DESC
      `),
      // Bucket 0 is the last 24 hours. Uses idx_logs_timestamp; rows never leave SQL.
      db.execute({
        sql: `
          SELECT CAST((? - timestamp) / ${DAY_MS} AS INTEGER) AS ago,
            COUNT(*) AS total,
            SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END) AS ok,
            SUM(CASE WHEN is_cache_hit = 1 THEN 1 ELSE 0 END) AS cache_hits,
            AVG(latency_ms) AS avg_latency
          FROM request_logs
          WHERE timestamp > ? AND timestamp <= ?
          GROUP BY ago
        `,
        args: [now, now - TREND_DAYS * DAY_MS, now],
      }),
    ]);

    const logs = logsResult.rows || [];
    const stats = statsResult.rows[0] ?? {};
    const totalRequests = Number(stats.total_count || 0);
    const avgLatency = Math.round(Number(stats.avg_latency || 0));
    const successCount = Number(stats.success_count || 0);
    const successRate = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100;
    const cacheHits = Number(stats.cache_hits || 0);

    const byAgo = new Map(dailyResult.rows.map((r) => [Number(r.ago), r]));
    // Oldest first, zero-filled.
    const daily = Array.from({ length: TREND_DAYS }, (_, i) => {
      const r = byAgo.get(TREND_DAYS - 1 - i);
      return {
        total: Number(r?.total ?? 0),
        ok: Number(r?.ok ?? 0),
        cacheHits: Number(r?.cache_hits ?? 0),
        avgLatencyMs: Math.round(Number(r?.avg_latency ?? 0)),
      };
    });

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
      metrics: {
        totalRequests,
        avgLatencyMs: avgLatency,
        successRate,
        cacheHits,
        cacheSavings: `$${(cacheHits * 0.0002).toFixed(4)}`,
        cacheHitRatio: totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0,
        daily,
      },
      facets: {
        origins: originsResult.rows || [],
        providers: providersResult.rows || []
      }
    });
  } catch (err) {
    console.error("[AdminLogs Error]:", err);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
