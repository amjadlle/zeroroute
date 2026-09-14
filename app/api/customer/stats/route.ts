import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const logsRes = await db.execute({
      sql: `SELECT * FROM request_logs WHERE customer_key = ? ORDER BY timestamp DESC LIMIT 50`,
      args: [session.key]
    });

    const logs = logsRes.rows || [];
    const totalRequests = logs.length;
    const avgLatency = totalRequests > 0
      ? Math.round(logs.reduce((acc: number, l: any) => acc + (Number(l.latency_ms) || 0), 0) / totalRequests)
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalRecentLogs: totalRequests,
        averageLatencyMs: avgLatency,
        logs
      }
    });
  } catch (err) {
    console.error("[CustomerStats Error]:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
