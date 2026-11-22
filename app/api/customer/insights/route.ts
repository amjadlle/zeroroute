import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { STOP_WORDS } from "@/lib/providers/rag";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const DAYS = 14;
const TOPICS = 3;
const TOPIC_SAMPLE = 1000;

// "Unanswered" = the request succeeded but the reply is the bot's refusal (RAG prompt Rule 2 in
// lib/providers/rag.ts: "I don't have specific information about that in my knowledge base…", or the
// no-knowledge "don't have any information" variant). That is a knowledge gap the customer can fix by
// adding an answer. Failed requests (status >= 400) are an outage, not a gap, so they are counted
// separately and never become topics. Matching is on response_preview (first 100 chars of the reply);
// LIKE is ASCII case-insensitive, and the patterns avoid the apostrophe so curly quotes match too.
const REFUSALS = ["%have specific information%", "%have any information%", "%in my knowledge base%"];
const IS_REFUSAL = `status < 400 AND (${REFUSALS.map(() => "response_preview LIKE ?").join(" OR ")})`;

// Words that say nothing about the topic of a question, on top of the retrieval stop words.
const FILLER = new Set(["can", "get", "any", "there", "please", "tell", "know", "want", "need", "like", "much", "many", "also", "just", "hi", "hello", "thanks"]);

const keywords = (text: string) =>
  text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !FILLER.has(w) && !/^\d+$/.test(w));

// Plurals only. rag.ts's stem() is tuned for retrieval and maps "instalment"/"instalments" to different
// stems, which would split one topic in two.
const stem = (w: string) => w.replace(/ies$/, "y").replace(/(?<=[^s])s$/, "");

/**
 * Groups unanswered questions (newest first) by shared keyword: the stem found in the most questions
 * becomes a topic, its questions are removed, repeat. Labelled with the most common spelling of the stem.
 * Ceiling: keyword overlap only, so "pay in instalments" and "split the cost" stay apart, and it reads at
 * most TOPIC_SAMPLE previews. Upgrade path: embed prompts and cluster by cosine similarity, stored at log time.
 */
function groupTopics(prompts: string[]) {
  let left = prompts.map((p) => {
    const words = keywords(p);
    return { prompt: p, words, stems: new Set(words.map(stem)) };
  }).filter((q) => q.stems.size > 0);
  const topics: { topic: string; count: number; example: string }[] = [];

  while (left.length > 0 && topics.length < TOPICS) {
    const counts = new Map<string, number>();
    for (const q of left) for (const s of q.stems) counts.set(s, (counts.get(s) ?? 0) + 1);
    // Map keeps insertion order, so ties go to the stem seen in the newest question.
    const [best] = [...counts].reduce((a, b) => (b[1] > a[1] ? b : a));
    const group = left.filter((q) => q.stems.has(best));
    const spellings = new Map<string, number>();
    for (const q of group) for (const w of q.words) if (stem(w) === best) spellings.set(w, (spellings.get(w) ?? 0) + 1);
    const [label] = [...spellings].reduce((a, b) => (b[1] > a[1] ? b : a));
    topics.push({ topic: label, count: group.length, example: group[0].prompt });
    left = left.filter((q) => !q.stems.has(best));
  }
  return topics;
}

/**
 * Home page insights for the signed-in customer (cookie session only): per-day counts for the last
 * DAYS UTC days, oldest first and zero-filled, plus the top unanswered-question topics in that window.
 * Both queries use idx_logs_customer_time (customer_key, timestamp).
 */
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const firstDay = Math.floor(Date.now() / DAY_MS) - (DAYS - 1);
  const since = firstDay * DAY_MS;

  try {
    const db = getDb();
    const [dailyRes, gapsRes] = await Promise.all([
      db.execute({
        sql: `SELECT timestamp / ${DAY_MS} AS day, COUNT(*) AS total, SUM(status >= 400) AS failed,
                SUM(CASE WHEN ${IS_REFUSAL} THEN 1 ELSE 0 END) AS unanswered,
                AVG(CASE WHEN status < 400 THEN latency_ms END) AS avg_reply
              FROM request_logs WHERE customer_key = ? AND timestamp >= ? GROUP BY day`,
        args: [...REFUSALS, session.key, since],
      }),
      db.execute({
        sql: `SELECT prompt_preview FROM request_logs WHERE customer_key = ? AND timestamp >= ? AND ${IS_REFUSAL}
              ORDER BY timestamp DESC LIMIT ${TOPIC_SAMPLE}`,
        args: [session.key, since, ...REFUSALS],
      }),
    ]);

    const byDay = new Map(dailyRes.rows.map((r) => [Number(r.day), r]));
    const days = Array.from({ length: DAYS }, (_, i) => {
      const r = byDay.get(firstDay + i);
      return {
        date: new Date((firstDay + i) * DAY_MS).toISOString().slice(0, 10),
        total: Number(r?.total ?? 0),
        failed: Number(r?.failed ?? 0),
        unanswered: Number(r?.unanswered ?? 0),
        avgReplyMs: Math.round(Number(r?.avg_reply ?? 0)),
      };
    });
    const topics = groupTopics(gapsRes.rows.map((r) => String(r.prompt_preview ?? "")).filter(Boolean));

    return NextResponse.json({ success: true, days, topics });
  } catch (err) {
    console.error("[CustomerInsights Error]:", err);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
