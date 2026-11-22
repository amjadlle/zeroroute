"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import { apiFetch } from "@/lib/client/api";
import { UNLIMITED_MONTHLY_REQUESTS } from "@/lib/constants";

export type InsightDay = { date: string; total: number; failed: number; unanswered: number; avgReplyMs: number };
export type Topic = { topic: string; count: number; example: string };
export type Insights = { days: InsightDay[]; topics: Topic[] };
type State = { data: Insights | null; error: string | null; reload: () => void };

const times = (n: number) => (n === 1 ? "once" : `${n.toLocaleString()} times`);
const sum = (days: InsightDay[], f: (d: InsightDay) => number) => days.reduce((s, d) => s + f(d), 0);

/** Loads /api/customer/insights (last 14 days) once `enabled` is true. */
export function useInsights(enabled: boolean): State {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch<Partial<Insights>>("/api/customer/insights");
      setData({ days: res.days ?? [], topics: res.topics ?? [] });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Something went wrong.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    if (enabled) reload();
  }, [enabled, reload]);

  return { data, error, reload };
}

/** The most-asked question topic the chatbot couldn't answer. Hidden when there is none. */
export function NextStep({ topics }: { topics: Topic[] }) {
  const top = topics[0];
  if (!top) return null;
  return (
    <section
      aria-labelledby="next-step-title"
      className="flex flex-wrap items-center gap-4 rounded-card border border-accent/30 bg-accent-soft px-4.5 py-4"
    >
      <span className="grid size-9.5 shrink-0 place-items-center rounded-control bg-accent text-accent-fg">
        <Sparkles aria-hidden className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1 basis-60">
        <p className="text-meta font-medium text-accent">Suggested next step</p>
        <h2 id="next-step-title" className="text-body-lg font-semibold">Add an answer about “{top.topic}”</h2>
        <p className="text-body text-text-muted">
          Visitors asked about this {times(top.count)} in the last 14 days and your chatbot had no answer.
          For example: “{top.example}”
        </p>
      </div>
      <div className="flex gap-2">
        <Button href="/app/usage?show=unanswered" variant="ghost" size="sm">See questions</Button>
        <Button href="/app/knowledge" size="sm" leftIcon={<Plus aria-hidden className="size-3.5" />}>Add answer</Button>
      </div>
    </section>
  );
}

function replyTime(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

type TilesProps = State & { used: number; limit: number };

/** Four KPI tiles over the last 14 days, each with a daily sparkline. */
export function InsightTiles({ data, error, reload, used, limit }: TilesProps) {
  if (error) {
    return (
      <Alert tone="danger" title="Couldn't load your chatbot's numbers">
        <p>{error}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={reload}>Try again</Button>
      </Alert>
    );
  }
  const grid = "grid grid-cols-2 gap-3 xl:grid-cols-4";
  if (!data) {
    return (
      <div className={grid} aria-busy="true">
        <span className="sr-only">Loading your chatbot&apos;s numbers</span>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const { days } = data;
  const total = sum(days, (d) => d.total);
  const answered = sum(days, (d) => d.total - d.failed - d.unanswered);
  const ok = sum(days, (d) => d.total - d.failed);
  const avgReply = ok > 0 ? sum(days, (d) => d.avgReplyMs * (d.total - d.failed)) / ok : 0;
  // Days without traffic are left out of the rate and reply trends instead of showing as dips to zero.
  const active = days.filter((d) => d.total > 0);
  const unlimited = limit >= UNLIMITED_MONTHLY_REQUESTS;

  return (
    <section aria-label="Last 14 days" className={grid}>
      <StatTile label="Questions" value={total.toLocaleString()} hint="Last 14 days" trend={days.map((d) => d.total)} />
      <StatTile
        label="Answered"
        value={total > 0 ? `${Math.round((answered / total) * 100)}%` : "—"}
        hint={total > 0 ? `${answered.toLocaleString()} of ${total.toLocaleString()}` : "No questions yet"}
        trend={active.length ? active.map((d) => (d.total - d.failed - d.unanswered) / d.total) : undefined}
      />
      <StatTile
        label="Average reply"
        value={ok > 0 ? replyTime(avgReply) : "—"}
        hint="Lower is better"
        trend={active.length ? active.map((d) => d.avgReplyMs) : undefined}
      />
      <StatTile
        label="Requests this month"
        value={used.toLocaleString()}
        hint={unlimited ? "No monthly limit" : `of ${limit.toLocaleString()} on your plan`}
        trend={days.map((_, i) => sum(days.slice(0, i + 1), (d) => d.total))}
      />
    </section>
  );
}

type Item = { key: string; badge: ReactNode; title: string; detail: string; action?: ReactNode };

/** Things the customer can act on: knowledge gaps, failed requests and a nearly used-up plan. */
export function NeedsAttention({ data, used, limit }: { data: Insights; used: number; limit: number }) {
  const unanswered = sum(data.days, (d) => d.unanswered);
  const failed = sum(data.days, (d) => d.failed);
  const pct = limit > 0 && limit < UNLIMITED_MONTHLY_REQUESTS ? Math.round((used / limit) * 100) : 0;

  const items: Item[] = [];
  if (unanswered > 0) {
    items.push({
      key: "unanswered",
      badge: <Badge tone="warning">{unanswered.toLocaleString()}</Badge>,
      title: "Questions your chatbot couldn't answer",
      detail: data.topics.map((t) => t.topic).join(", ") || "Last 14 days",
      action: <Button href="/app/knowledge" variant="secondary" size="sm">Add answer</Button>,
    });
  }
  if (failed > 0) {
    items.push({
      key: "failed",
      badge: <Badge tone="danger">{failed.toLocaleString()}</Badge>,
      title: failed === 1 ? "Request that failed" : "Requests that failed",
      detail: "Visitors got an error instead of a reply in the last 14 days.",
      action: <Button href="/app/usage" variant="secondary" size="sm">View</Button>,
    });
  }
  if (pct >= 80) {
    items.push({
      key: "usage",
      badge: <Badge tone={pct >= 100 ? "danger" : "warning"}>{pct}%</Badge>,
      title: pct >= 100 ? "You've reached this month's limit" : "You've used most of this month's requests",
      detail: `${used.toLocaleString()} of ${limit.toLocaleString()} requests`,
      action: <Button href="/app/billing" variant="secondary" size="sm">Compare plans</Button>,
    });
  }

  return (
    <Card>
      <CardHeader title="Needs attention" actions={items.length > 0 && <Badge>{items.length}</Badge>} />
      <ul className="divide-y divide-border">
        {items.length === 0 ? (
          <li className="flex items-center gap-3 px-4.5 py-3">
            <Badge tone="success">OK</Badge>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium">Nothing needs your attention</p>
              <p className="text-meta text-text-muted">Your chatbot answered every question in the last 14 days.</p>
            </div>
          </li>
        ) : (
          items.map((it) => (
            <li key={it.key} className="flex flex-wrap items-center gap-3 px-4.5 py-3">
              {it.badge}
              <div className="min-w-0 flex-1 basis-40">
                <p className="text-body font-medium">{it.title}</p>
                <p className="truncate text-meta text-text-muted">{it.detail}</p>
              </div>
              {it.action}
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
