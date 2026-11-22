// "Unanswered" = the request succeeded but the reply is the bot's refusal (RAG prompt Rule 2 in
// lib/providers/rag.ts: "I don't have specific information about that in my knowledge base…", or the
// no-knowledge "don't have any information" variant). That is a knowledge gap the customer can fix by
// adding an answer. Failed requests (status >= 400) are an outage, not a gap, so they never count.
// Matching is on response_preview (first 100 chars of the reply); the patterns avoid the apostrophe so
// curly quotes match too. Ceiling: a phrase match, so a reworded refusal prompt needs these updated.
const PHRASES = ["have specific information", "have any information", "in my knowledge base"];

/** LIKE args for UNANSWERED_SQL, in order. LIKE is ASCII case-insensitive in SQLite. */
export const UNANSWERED_ARGS = PHRASES.map((p) => `%${p}%`);

/** SQL condition on request_logs; bind UNANSWERED_ARGS where it appears. */
export const UNANSWERED_SQL = `status < 400 AND (${PHRASES.map(() => "response_preview LIKE ?").join(" OR ")})`;

/** Same test as UNANSWERED_SQL, for a row already loaded. */
export const isUnanswered = (r: { status?: number | null; response_preview?: string | null }) =>
  r.status != null && r.status < 400 && PHRASES.some((p) => r.response_preview?.toLowerCase().includes(p));
