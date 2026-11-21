"use client";

import { Inbox } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { CopyButton } from "@/components/ui/CopyButton";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Markdown } from "@/components/ui/Markdown";
import { SecretField } from "@/components/ui/SecretField";

const EMBED = `<script
  src="https://zeroroute.mapki.in/widget.js"
  data-bot-id="bot_YOUR_BOT_ID"
  data-title="Ask us anything"
  defer
></script>`;

type LogRow = { id: string; time: string; customer: string; provider: string; status: number; latency: number };

const LOGS: LogRow[] = [
  { id: "r1", time: "12:04:51", customer: "Acme Store", provider: "Groq", status: 200, latency: 412 },
  { id: "r2", time: "12:04:37", customer: "Northwind", provider: "Cerebras", status: 200, latency: 188 },
  { id: "r3", time: "12:03:59", customer: "Blue Fern", provider: "Gemini", status: 429, latency: 95 },
  { id: "r4", time: "12:03:12", customer: "Acme Store", provider: "OpenRouter", status: 200, latency: 1240 },
  { id: "r5", time: "12:02:44", customer: "Kite Labs", provider: "Mistral", status: 500, latency: 3010 },
  { id: "r6", time: "12:02:05", customer: "Northwind", provider: "Groq", status: 200, latency: 356 },
  { id: "r7", time: "12:01:30", customer: "Harbor Co", provider: "IFM", status: 200, latency: 640 },
  { id: "r8", time: "12:00:58", customer: "Blue Fern", provider: "Cerebras", status: 200, latency: 201 },
];

const statusTone = (s: number) => (s < 300 ? "success" : s < 500 ? "warning" : "danger");

const COLUMNS: Column<LogRow>[] = [
  { key: "time", header: "Time", sortable: true, cell: (r) => <span className="font-ui-mono tabular-nums">{r.time}</span> },
  { key: "customer", header: "Customer", sortable: true },
  { key: "provider", header: "Provider", sortable: true },
  { key: "status", header: "Status", sortable: true, cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  { key: "latency", header: "Latency", align: "right", sortable: true, cell: (r) => <span className="tabular-nums">{r.latency} ms</span> },
];

const SAMPLE = `Here is how to **install** the widget on *any* site:

1. Copy the snippet from the Install page.
2. Paste it before \`</body>\`.

\`\`\`html
<script src="https://zeroroute.mapki.in/widget.js" data-bot-id="bot_123" defer></script>
\`\`\`

- Read the [install guide](https://zeroroute.mapki.in/docs)
- Email [support](mailto:support@example.com)
- This [sneaky link](javascript:alert(document.cookie)) shows as plain text.

Line one of a paragraph,
line two after a single line break.`;

function Label({ children }: { children: ReactNode }) {
  return <h3 className="text-meta font-medium tracking-wide text-text-subtle uppercase">{children}</h3>;
}

export default function DataDisplaySection() {
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="space-y-8 font-ui">
      <div className="space-y-3">
        <Label>Code block (embed snippet)</Label>
        <CodeBlock code={EMBED} language="html" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Label>Secret field</Label>
          <SecretField value="zr_live_8f3a2c71d9b04e6a5c12" label="API key" />
          <SecretField value="bot_4f9e1a7c22" label="Bot ID" />
        </div>
        <div className="space-y-3">
          <Label>Copy button</Label>
          <div className="flex flex-wrap items-center gap-3">
            <CopyButton value="bot_4f9e1a7c22" label="Copy Bot ID" />
            <CopyButton value="bot_4f9e1a7c22" label="Copy Bot ID" variant="text" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Data table (request log)</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" className="aria-pressed:border-accent" aria-pressed={loading} onClick={() => setLoading(!loading)}>
            Loading
          </Button>
          <Button size="sm" variant="secondary" className="aria-pressed:border-accent" aria-pressed={empty} onClick={() => setEmpty(!empty)}>
            Empty
          </Button>
          <span className="text-meta text-text-muted" aria-live="polite">
            {opened ? `Opened ${opened}` : "Click a row or press Enter on it"}
          </span>
        </div>
        <div className="rounded-card border border-border bg-surface p-2 sm:p-0">
          <DataTable
            label="Recent requests"
            columns={COLUMNS}
            rows={empty ? [] : LOGS}
            getRowId={(r) => r.id}
            loading={loading}
            onRowClick={(r) => setOpened(`${r.customer} at ${r.time}`)}
            empty={<EmptyState icon={Inbox} title="No requests yet" description="Requests show up here as soon as your chatbot answers one." />}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Markdown (chat output)</Label>
        <div className="rounded-card border border-border bg-surface p-4">
          <Markdown>{SAMPLE}</Markdown>
        </div>
      </div>
    </div>
  );
}
