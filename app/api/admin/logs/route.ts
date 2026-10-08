import { NextResponse } from "next/server";
import { resolveAuth } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

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

    if (search) {
      conditions.push("(prompt_preview LIKE ? OR response_preview LIKE ? OR model LIKE ? OR id LIKE ?)");
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 2. Fetch Filtered Logs + Aggregation Metrics concurrently in a single batch
    const [logsResult, statsResult, originsResult, providersResult] = await Promise.all([
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
      `)
    ]);

    const logs = logsResult.rows || [];
    const stats = statsResult.rows[0] as any || {};
    const totalRequests = Number(stats.total_count || 0);
    const avgLatency = Math.round(Number(stats.avg_latency || 0));
    const successCount = Number(stats.success_count || 0);
    const successRate = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100;
    const cacheHits = Number(stats.cache_hits || 0);

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
      metrics: {
        totalRequests,
        avgLatencyMs: avgLatency || 450,
        successRate,
        cacheHits,
        cacheSavings: `$${(cacheHits * 0.0002).toFixed(4)}`,
        cacheHitRatio: totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0,
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
