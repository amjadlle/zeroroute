"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
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
  if (!p.configured) return { label: "No key", tone: "warning", ready: false };
  if (p.cooldownUntil > now) {
    return { label: `Paused, back in ${Math.ceil((p.cooldownUntil - now) / 1000)}s`, tone: "warning", ready: false };
  }
  if (p.consecutiveFailures > 0) return { label: `${p.consecutiveFailures} failed in a row`, tone: "danger", ready: true };
  return { label: "Ready", tone: "success", ready: true };
}

/** Median of the values; undefined for an empty list. */
export function median(values: number[]) {
  if (!values.length) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export const isError = (log: GlobalLogItem) => log.status < 200 || log.status >= 300;

export function ProviderHealth({ providers, now }: { providers: ProviderItem[]; now: number }) {
  const sorted = [...providers].sort((a, b) => a.order - b.order);
  return (
    <Card>
      <CardHeader title="Provider health" description="Tried in this order. Open Providers to change it." />
      {sorted.length === 0 ? (
        <EmptyState title="No providers yet" />
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((p) => {
            const status = providerStatus(p, now);
            const rl = p.rateLimits;
            return (
              <li key={p.id} className="grid gap-1 px-4.5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-body font-medium">{p.name}</span>
                  <Badge tone={status.tone} dot>
                    {status.label}
                  </Badge>
                </div>
                <p className="flex flex-wrap gap-x-4 text-meta text-text-muted">
                  <span>Priority {p.order}</span>
                  <span className="tabular-nums">Last response {p.lastLatencyMs ? `${p.lastLatencyMs.toLocaleString()} ms` : "—"}</span>
                  {rl?.remainingRequests && (
                    <span className="tabular-nums">
                      Requests left {rl.remainingRequests}
                      {rl.limitRequests ? ` of ${rl.limitRequests}` : ""}
                    </span>
                  )}
                </p>
                {status.tone === "danger" && p.lastError && (
                  <p className="truncate text-meta text-danger-fg" title={p.lastError}>
                    {p.lastError}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const ERROR_COLUMNS: Column<GlobalLogItem>[] = [
  { key: "timestamp", header: "When", cell: (l) => new Date(l.timestamp).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) },
  { key: "provider", header: "Provider", cell: (l) => `${l.provider} / ${l.model}` },
  { key: "status", header: "Status", align: "right", cell: (l) => <Badge tone="danger">{l.status}</Badge> },
];

export function RecentErrors({ logs }: { logs: GlobalLogItem[] }) {
  const errors = logs.filter(isError).slice(0, 8);
  return (
    <Card>
      <CardHeader
        title="Recent errors"
        description={`Failed requests among the last ${logs.length.toLocaleString()}.`}
        actions={
          <Link href="/admin/logs" className="text-meta font-medium text-accent hover:underline">
            Open request log
          </Link>
        }
      />
      <DataTable
        label="Recent errors"
        columns={ERROR_COLUMNS}
        rows={errors}
        getRowId={(l) => l.id}
        empty={<EmptyState icon={CircleCheck} title="No errors" description="Every recent request succeeded." />}
      />
    </Card>
  );
}
