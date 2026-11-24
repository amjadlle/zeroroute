"use client";

import { useEffect, useState } from "react";
import { ChevronRight, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import type { Tone } from "@/components/ui/StatusDot";
import type { ProviderItem } from "./AdminProvidersTab";
import type { GlobalLogItem } from "./AdminLogsTab";

/**
 * Current time that ticks every second until `deadline` (ms) has passed, then stops.
 * Pass the latest cooldown end so countdowns update without re-rendering forever.
 */
export function useNow(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= deadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  return now;
}

/** One status per provider, in the order a problem matters: off, no key, cooling down, failing, ready. */
export function providerStatus(p: ProviderItem, now: number): { label: string; tone: Tone; ready: boolean } {
  if (!p.enabled) return { label: "Off", tone: "neutral", ready: false };
  if (!p.configured) return { label: "Key missing", tone: "warning", ready: false };
  if (p.cooldownUntil > now) {
    return { label: `Paused, back in ${Math.ceil((p.cooldownUntil - now) / 1000)}s`, tone: "warning", ready: false };
  }
  if (p.consecutiveFailures > 0) return { label: `${p.consecutiveFailures} failed in a row`, tone: "danger", ready: true };
  return { label: "Ready", tone: "success", ready: true };
}

export const isError = (log: GlobalLogItem) => log.status < 200 || log.status >= 300;

/** One rolling 24-hour bucket from GET /api/admin/logs `metrics.daily`, oldest first. */
export type TrendDay = { total: number; ok: number; cacheHits: number; avgLatencyMs: number };

const WEEK = 7;

function totals(days: TrendDay[]) {
  const sum = (f: (d: TrendDay) => number) => days.reduce((s, d) => s + f(d), 0);
  const total = sum((d) => d.total);
  if (!total) return { total };
  return {
    total,
    successRate: (sum((d) => d.ok) / total) * 100,
    cacheRate: (sum((d) => d.cacheHits) / total) * 100,
    latencyMs: sum((d) => d.avgLatencyMs * d.total) / total,
  };
}

/** "+6%" / "−48 ms", or nothing when there is no earlier week or no change after rounding. */
function change(now: number | undefined, before: number | undefined, unit: string, digits = 0) {
  if (now === undefined || before === undefined) return undefined;
  const diff = Number((now - before).toFixed(digits));
  if (!diff) return undefined;
  return { text: `${diff > 0 ? "+" : "−"}${Math.abs(diff).toLocaleString()}${unit}`, up: diff > 0 };
}

const pct = (n: number) => `${Number(n.toFixed(1))}%`;

/** Four KPI tiles for the last 7 days, each compared with the 7 days before and with a daily sparkline. */
export function OverviewKpis({ daily }: { daily: TrendDay[] }) {
  const week = daily.slice(-WEEK);
  const now = totals(week);
  const before = totals(daily.slice(-2 * WEEK, -WEEK));
  // Days without traffic are left out of rate and latency trends instead of showing as dips to zero.
  const active = week.filter((d) => d.total > 0);
  const empty = "No requests in the last 7 days";

  const tile = (
    label: string,
    value: string | undefined,
    hint: string,
    delta: ReturnType<typeof change>,
    trend: number[] | undefined,
    lowerIsBetter = false,
  ) => (
    <StatTile
      label={label}
      value={value ?? "—"}
      hint={value === undefined ? empty : hint}
      delta={delta && (
        <>
          {delta.text}
          <span className="sr-only"> compared with the 7 days before</span>
        </>
      )}
      deltaTone={delta && delta.up !== lowerIsBetter ? "positive" : "negative"}
      trend={trend?.length ? trend : undefined}
    />
  );

  const requestsChange =
    before.total > 0 ? change((now.total / before.total) * 100, 100, "%") : undefined;

  return (
    <section aria-label="Last 7 days" className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {tile("Requests", now.total ? now.total.toLocaleString() : undefined, "Last 7 days", requestsChange, now.total ? week.map((d) => d.total) : undefined)}
      {tile(
        "Success rate",
        now.successRate === undefined ? undefined : pct(now.successRate),
        "Last 7 days",
        change(now.successRate, before.successRate, " pts", 1),
        active.map((d) => d.ok / d.total),
      )}
      {tile(
        "Response time",
        now.latencyMs === undefined ? undefined : `${Math.round(now.latencyMs).toLocaleString()} ms`,
        "Average, last 7 days",
        change(now.latencyMs, before.latencyMs, " ms"),
        active.map((d) => d.avgLatencyMs),
        true,
      )}
      {tile(
        "Answered from cache",
        now.cacheRate === undefined ? undefined : pct(now.cacheRate),
        "Last 7 days",
        change(now.cacheRate, before.cacheRate, " pts", 1),
        active.map((d) => d.cacheHits / d.total),
      )}
    </section>
  );
}

export function ProviderHealth({ providers, now }: { providers: ProviderItem[]; now: number }) {
  const sorted = [...providers].sort((a, b) => a.order - b.order);
  return (
    <Card>
      <CardHeader
        title="Providers"
        description="Tried from top to bottom."
        actions={
          <Button href="/admin/providers" variant="ghost" size="sm" rightIcon={<ChevronRight aria-hidden className="size-3.5" />}>
            Manage
          </Button>
        }
      />
      {sorted.length === 0 ? (
        <EmptyState title="No providers yet" />
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((p) => {
            const status = providerStatus(p, now);
            return (
              <li key={p.id} className="flex items-center gap-3 px-4.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{p.name}</p>
                  <p className="truncate font-ui-mono text-meta text-text-muted">{p.models?.[0] ?? p.model}</p>
                </div>
                <span className="shrink-0 text-meta text-text-subtle tabular-nums">
                  {p.lastLatencyMs ? `${p.lastLatencyMs.toLocaleString()} ms` : "—"}
                </span>
                <Badge tone={status.tone} dot className="shrink-0">
                  {status.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function RecentErrors({ logs }: { logs: GlobalLogItem[] }) {
  const errors = logs.filter(isError).slice(0, 8);
  return (
    <Card>
      <CardHeader
        title="Recent failures"
        actions={
          <Button href="/admin/logs" variant="ghost" size="sm" rightIcon={<ChevronRight aria-hidden className="size-3.5" />}>
            Request log
          </Button>
        }
      />
      {logs.length === 0 ? (
        <EmptyState title="No requests yet" description="Failed requests will show here." />
      ) : errors.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title="No failures"
          description={`The last ${logs.length.toLocaleString()} requests all succeeded.`}
        />
      ) : (
        <ul aria-label="Recent failures" className="divide-y divide-border">
          {errors.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4.5 py-3">
              <Badge tone="danger" className="shrink-0 tabular-nums">
                {l.status}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium">{l.provider}</p>
                <p className="truncate font-ui-mono text-meta text-text-muted">{l.model}</p>
              </div>
              <time dateTime={new Date(l.timestamp).toISOString()} className="shrink-0 text-meta text-text-subtle tabular-nums">
                {new Date(l.timestamp).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
