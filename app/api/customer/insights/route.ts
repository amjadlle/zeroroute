import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { STOP_WORDS } from "@/lib/providers/rag";
// Shared with the Usage page's "Unanswered only" filter so both count the same questions.
import { UNANSWERED_ARGS as REFUSALS, UNANSWERED_SQL as IS_REFUSAL } from "@/lib/unanswered";

export const dynamic = "force-dynamic";

const DAYS = 14;
const TOPICS = 3;
const TOPIC_SAMPLE = 1000;

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

/** The tz query param if Intl knows it, else UTC. Untrusted input: Intl throws on unknown zones. */
function zone(tz: string | null) {
  if (!tz) return "UTC";
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz }).resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * The UTC instants at which the last DAYS local days in `tz` start, with their YYYY-MM-DD labels,
 * oldest first. Offsets come from Intl per day, so a DST change inside the window is exact (a fixed
 * offset from "now" would shift every day before the change by an hour).
 */
function localDays(tz: string, now: number) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  });
  const parts = (t: number) =>
    Object.fromEntries(fmt.formatToParts(t).map((p) => [p.type, Number(p.value)])) as Record<string, number>;
  // Wall-clock time in tz minus true time = the zone's UTC offset at t.
  const offset = (t: number) => {
    const p = parts(t);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
  };
  const today = parts(now);
  return Array.from({ length: DAYS }, (_, i) => {
    const wall = Date.UTC(today.year, today.month - 1, today.day - (DAYS - 1) + i); // calendar math only
    const date = new Date(wall).toISOString().slice(0, 10);
    // Try the offset either side of a transition; the earliest instant that is on `date` locally is the
    // day's start. Covers zones that skip midnight (day starts 01:00) and ones that repeat it.
    const first = wall - offset(wall);
    const start = [first, wall - offset(first)]
      .filter((t) => { const p = parts(t); return Date.UTC(p.year, p.month - 1, p.day) === wall; })
      .reduce((a, b) => Math.min(a, b), first);
    return { date, start };
  });
}

/**
 * Home page insights for the signed-in customer (cookie session only): per-day counts for the last
 * DAYS days in the browser's time zone (`?tz=Europe/London`, UTC when missing or unknown), oldest first
 * and zero-filled, plus the top unanswered-question topics in that window.
 * Both queries use idx_logs_customer_time (customer_key, timestamp); days are bucketed in SQL by comparing
 * the timestamp against each local day's start, so no rows are pulled into JS.
 */
export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bounds = localDays(zone(new URL(req.url).searchParams.get("tz")), Date.now());
  const since = bounds[0].start;
  // Newest day first, so the first matching start wins; anything older is day 0 (filtered by `since`).
  const dayIndex = `CASE ${bounds.slice(1).map(() => "WHEN timestamp >= ? THEN ?").reverse().join(" ")} ELSE 0 END`;
  const dayArgs = bounds.slice(1).map((b, i) => [b.start, i + 1]).reverse().flat();

  try {
    const db = getDb();
    const [dailyRes, gapsRes] = await Promise.all([
      db.execute({
        sql: `SELECT ${dayIndex} AS day, COUNT(*) AS total, SUM(status >= 400) AS failed,
                SUM(CASE WHEN ${IS_REFUSAL} THEN 1 ELSE 0 END) AS unanswered,
                AVG(CASE WHEN status < 400 THEN latency_ms END) AS avg_reply
              FROM request_logs WHERE customer_key = ? AND timestamp >= ? GROUP BY day`,
        args: [...dayArgs, ...REFUSALS, session.key, since],
      }),
      db.execute({
        sql: `SELECT prompt_preview FROM request_logs WHERE customer_key = ? AND timestamp >= ? AND ${IS_REFUSAL}
              ORDER BY timestamp DESC LIMIT ${TOPIC_SAMPLE}`,
        args: [session.key, since, ...REFUSALS],
      }),
    ]);

    const byDay = new Map(dailyRes.rows.map((r) => [Number(r.day), r]));
    const days = Array.from({ length: DAYS }, (_, i) => {
      const r = byDay.get(i);
      return {
        date: bounds[i].date,
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
