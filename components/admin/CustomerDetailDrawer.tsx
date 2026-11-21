"use client";

import type { ReactNode } from "react";
import { Pause, Play, RotateCw, ScrollText, Trash2 } from "lucide-react";
import { buildEmbedSnippet, parsePrompts } from "@/lib/embedSnippet";
import { PLAN_LABELS, PLAN_LIMITS, UNLIMITED_MONTHLY_REQUESTS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Drawer } from "@/components/ui/Drawer";
import { Meter } from "@/components/ui/Meter";
import { SecretField } from "@/components/ui/SecretField";

export interface CustomerAdminItem {
  id: string;
  key: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  bot_title?: string;
  bot_role?: string;
  greeting?: string;
  /** JSON array of suggested questions, as stored. */
  prompts?: string;
  status: string;
  subscription_expires?: number;
  monthly_requests: number;
  monthly_limit: number;
  bot_id?: string;
  allowed_domains?: string;
  created_at: number;
}

export const isUnlimited = (c: CustomerAdminItem) => c.monthly_limit >= UNLIMITED_MONTHLY_REQUESTS;

// Ceiling: there is no plan column, so the plan is read from the quota (same rule as isPaidPlan).
export function planLabel(c: CustomerAdminItem) {
  if (isUnlimited(c)) return "Unlimited";
  return c.monthly_limit >= PLAN_LIMITS.pro.monthlyRequests ? PLAN_LABELS.pro : PLAN_LABELS.free;
}

const STATUS = {
  active: { label: "Active", tone: "success" },
  paused: { label: "Paused", tone: "warning" },
  canceled: { label: "Canceled", tone: "neutral" },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as keyof typeof STATUS] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function UsageMeter({ customer: c }: { customer: CustomerAdminItem }) {
  const used = c.monthly_requests.toLocaleString();
  if (isUnlimited(c)) return <span className="text-text-muted">{used} (no limit)</span>;
  const pct = c.monthly_limit > 0 ? (c.monthly_requests / c.monthly_limit) * 100 : 0;
  const text = `${used} of ${c.monthly_limit.toLocaleString()}`;
  return (
    <span className="grid min-w-32 gap-1">
      <span className="text-meta text-text-muted">{text}</span>
      <Meter
        value={c.monthly_requests}
        max={c.monthly_limit}
        tone={pct >= 90 ? "danger" : pct >= 70 ? "warning" : "accent"}
        label={`Requests this month for ${c.email}`}
        valueText={text}
      />
    </span>
  );
}

function domainsOf(raw?: string) {
  try {
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) && list.length ? list.join(", ") : "Any website";
  } catch {
    return raw || "Any website";
  }
}

type CustomerDetailDrawerProps = {
  customer: CustomerAdminItem | null;
  onClose: () => void;
  onViewLogs?: (key: string) => void;
  onRotateKey: (c: CustomerAdminItem) => void;
  onToggleStatus: (c: CustomerAdminItem) => void;
  onDelete: (c: CustomerAdminItem) => void;
  busy?: boolean;
};

export function CustomerDetailDrawer({ customer: c, onClose, onViewLogs, onRotateKey, onToggleStatus, onDelete, busy }: CustomerDetailDrawerProps) {
  const row = (label: string, value: ReactNode) => (
    <div className="grid gap-1">
      <dt className="text-meta text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );

  return (
    <Drawer
      open={c !== null}
      onClose={onClose}
      title={c?.company || c?.name || "Customer"}
      description={c?.email}
      footer={
        c && (
          <>
            <Button variant="danger" leftIcon={<Trash2 aria-hidden className="size-4" />} onClick={() => onDelete(c)} disabled={busy} className="mr-auto">
              Delete
            </Button>
            <Button
              variant="secondary"
              leftIcon={c.status === "active" ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
              onClick={() => onToggleStatus(c)}
              disabled={busy}
            >
              {c.status === "active" ? "Pause" : "Resume"}
            </Button>
            <Button variant="secondary" leftIcon={<RotateCw aria-hidden className="size-4" />} onClick={() => onRotateKey(c)} disabled={busy}>
              Rotate key
            </Button>
          </>
        )
      }
    >
      {c && (
        <div className="grid gap-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            {row("Status", <StatusBadge status={c.status} />)}
            {row("Plan", planLabel(c))}
            {row("Bot ID", c.bot_id ? <code className="font-ui-mono">{c.bot_id}</code> : "None")}
            {row("Created", new Date(c.created_at).toLocaleDateString())}
            {row("Allowed domains", domainsOf(c.allowed_domains))}
            {row("Requests this month", <UsageMeter customer={c} />)}
          </dl>

          <div className="grid gap-1.5">
            <p className="font-medium">API key</p>
            <SecretField value={c.key} label="API key" />
          </div>

          {onViewLogs && (
            <Button variant="secondary" leftIcon={<ScrollText aria-hidden className="size-4" />} onClick={() => onViewLogs(c.key)} className="justify-self-start">
              View request log
            </Button>
          )}

          {c.bot_id && (
            <div className="grid gap-1.5">
              <p className="font-medium">Embed snippet</p>
              <CodeBlock
                language="html"
                code={buildEmbedSnippet({ botId: c.bot_id, title: c.bot_title, greeting: c.greeting, prompts: parsePrompts(c.prompts) })}
              />
              <p className="text-meta text-text-muted">Brand colour and logo are not saved, so this snippet uses the defaults.</p>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
