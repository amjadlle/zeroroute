"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Drawer } from "@/components/ui/Drawer";
import { SecretField } from "@/components/ui/SecretField";
import type { GlobalLogItem } from "./AdminLogsTab";

export const isSuccess = (status: number) => status >= 200 && status < 300;
export const siteOf = (log: GlobalLogItem) => log.origin || "Direct API";
export const formatTime = (ts: number) => new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Providers that failed before one answered, e.g. "groq/llama: 429". Stored as a JSON array string. */
export function retriesOf(log: GlobalLogItem): string[] {
  try {
    const list: unknown = JSON.parse(log.failovers || "[]");
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}

export function StatusBadge({ status }: { status: number }) {
  return <Badge tone={isSuccess(status) ? "success" : "danger"}>{status}</Badge>;
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-meta text-text-subtle">{label}</dt>
      <dd className="mt-0.5 break-words text-text">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-meta font-medium text-text-muted">{title}</h3>
      {children}
    </section>
  );
}

const Text = ({ children }: { children?: string }) => (
  <p className="rounded-card border border-border bg-surface-sunken p-3 break-words whitespace-pre-wrap">{children || "—"}</p>
);

/** Everything stored about one request. Closed when `log` is null. */
export function LogDetailDrawer({ log, onClose }: { log: GlobalLogItem | null; onClose: () => void }) {
  const retries = log ? retriesOf(log) : [];
  return (
    <Drawer open={log !== null} onClose={onClose} title="Request details" description={log ? formatTime(log.timestamp) : undefined}>
      {log && (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Item label="Status"><StatusBadge status={log.status} /></Item>
            <Item label="Response time">{log.latency_ms.toLocaleString()} ms</Item>
            <Item label="Provider"><span className="capitalize">{log.provider}</span></Item>
            <Item label="Model"><span className="font-ui-mono">{log.model}</span></Item>
            <Item label="Site">{siteOf(log)}</Item>
            <Item label="Tokens">
              {(log.total_tokens || 0).toLocaleString()}
              <span className="text-text-muted"> ({log.prompt_tokens || 0} in, {log.completion_tokens || 0} out)</span>
            </Item>
            <Item label="Streamed">{log.is_stream ? "Yes" : "No"}</Item>
            <Item label="From cache">{log.is_cache_hit ? "Yes" : "No"}</Item>
          </dl>

          <Section title="Customer API key">
            <SecretField label="Customer API key" value={log.customer_key} />
          </Section>
          <Section title="Prompt (first 100 characters)"><Text>{log.prompt_preview}</Text></Section>
          <Section title="Response (first 100 characters)"><Text>{log.response_preview}</Text></Section>

          {retries.length > 0 && (
            <Section title={`Failed attempts before this answer (${retries.length})`}>
              <ol className="list-decimal space-y-1 pl-5 break-words text-text">
                {retries.map((r, i) => <li key={i}>{r}</li>)}
              </ol>
            </Section>
          )}

          {/* The key is left out so it stays behind the reveal button above. */}
          <Section title="Full record">
            <CodeBlock code={JSON.stringify(log, (k, v) => (k === "customer_key" ? undefined : v), 2)} language="json" />
          </Section>
        </div>
      )}
    </Drawer>
  );
}
