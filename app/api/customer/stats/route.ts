import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { UNANSWERED_ARGS, UNANSWERED_SQL } from "@/lib/unanswered";

export const dynamic = "force-dynamic";

// The Usage page's filter. "answered" is the complement of "unanswered" among successful requests;
// COALESCE because a NULL response_preview makes the LIKE test NULL, and NOT NULL would drop the row.
const FILTERS = new Map<string, { sql: string; args: string[] }>(Object.entries({
  answered: { sql: `status < 400 AND NOT COALESCE((${UNANSWERED_SQL}), 0)`, args: UNANSWERED_ARGS },
  unanswered: { sql: UNANSWERED_SQL, args: UNANSWERED_ARGS },
  failed: { sql: "status >= 400", args: [] },
}));

/** The signed-in customer's latest 50 logs; `?show=answered|unanswered|failed` keeps only that kind. */
export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filter = FILTERS.get(new URL(req.url).searchParams.get("show") ?? "");
    const db = getDb();
    const logsRes = await db.execute({
      sql: `SELECT id, timestamp, origin, prompt_preview, response_preview, latency_ms, status FROM request_logs WHERE customer_key = ?${filter ? ` AND ${filter.sql}` : ""} ORDER BY timestamp DESC LIMIT 50`,
      args: [session.key, ...(filter?.args ?? [])]
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
