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
    const db = getDb();
    const result = await db.execute(`
      SELECT 
        id, customer_key, timestamp, origin, prompt_preview, response_preview,
        provider, model, latency_ms, status, is_stream, is_cache_hit, failovers,
        prompt_tokens, completion_tokens, total_tokens
      FROM request_logs 
      ORDER BY timestamp DESC 
      LIMIT 100
    `);

    const logs = result.rows || [];

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    console.error("[AdminLogs Error]:", err);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
