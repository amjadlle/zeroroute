import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { UNANSWERED_ARGS, UNANSWERED_SQL } from "@/lib/unanswered";

export const dynamic = "force-dynamic";

/** The signed-in customer's latest 50 logs; `?unanswered=1` keeps only questions the bot couldn't answer. */
export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const unanswered = new URL(req.url).searchParams.get("unanswered") === "1";
    const db = getDb();
    const logsRes = await db.execute({
      sql: `SELECT id, timestamp, origin, prompt_preview, response_preview, latency_ms, status FROM request_logs WHERE customer_key = ?${unanswered ? ` AND ${UNANSWERED_SQL}` : ""} ORDER BY timestamp DESC LIMIT 50`,
      args: [session.key, ...(unanswered ? UNANSWERED_ARGS : [])]
    });

    const logs = logsRes.rows || [];
    const totalRequests = logs.length;
    const avgLatency = totalRequests > 0
      ? Math.round(logs.reduce((acc, l) => acc + (Number(l.latency_ms) || 0), 0) / totalRequests)
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
