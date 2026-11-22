"use client";

import { Download, MessageCircleQuestion, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Switch } from "@/components/ui/Switch";
import { useSearchParamValue } from "@/components/ui/useSearchParamValue";
import { apiFetch } from "@/lib/client/api";
import { isUnanswered } from "@/lib/unanswered";

export type Conversation = {
  id: string;
  timestamp: number;
  origin?: string | null;
  prompt_preview?: string | null;
  response_preview?: string | null;
  latency_ms?: number | null;
  status?: number | null;
};

const when = (ts: number) => new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const answered = (c: Conversation) => c.status === 200;
const result = (c: Conversation) =>
  isUnanswered(c) ? ({ label: "Not answered", tone: "warning" } as const)
  : answered(c) ? ({ label: "Answered", tone: "success" } as const)
  : ({ label: "Failed", tone: "danger" } as const);

const COLUMNS: Column<Conversation>[] = [
  { key: "timestamp", header: "Time", sortable: true, cell: (c) => <span className="whitespace-nowrap tabular-nums">{when(c.timestamp)}</span> },
  { key: "prompt_preview", header: "Question", cell: (c) => <span className="line-clamp-2 sm:max-w-md">{c.prompt_preview || "No question text"}</span> },
  { key: "origin", header: "Website", sortable: true, cell: (c) => <span className="break-all text-text-muted">{c.origin || "Direct"}</span> },
  {
    key: "status",
    header: "Result",
    sortable: true,
    cell: (c) => <Badge tone={result(c).tone}>{result(c).label}</Badge>,
  },
  { key: "latency_ms", header: "Reply time", align: "right", sortable: true, cell: (c) => <span className="tabular-nums">{c.latency_ms ?? 0} ms</span> },
];

// Visitor text is untrusted: a leading ' stops spreadsheets running it as a formula.
const csvCell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

/** CSV of the given conversations (RFC 4180 quoting), safe to open in a spreadsheet. */
export function conversationsCsv(rows: Conversation[]): string {
  const lines = [["Time", "Website", "Question", "Answer", "Result", "Reply time (ms)"]];
  for (const c of rows) {
    lines.push([new Date(c.timestamp).toISOString(), c.origin ?? "", c.prompt_preview ?? "", c.response_preview ?? "", result(c).label, String(c.latency_ms ?? "")]);
  }
  return lines.map((l) => l.map(csvCell).join(",")).join("\r\n");
}

function download(rows: Conversation[]) {
  const url = URL.createObjectURL(new Blob([conversationsCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `visitor-conversations-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Recent visitor conversations from /api/customer/stats, with search, details and CSV export.
 * `?show=unanswered` in the page URL turns on "Unanswered only" (Home links there); needs a <Suspense> parent.
 */
export function VisitorConversations() {
  const [rows, setRows] = useState<Conversation[]>([]);
  const [avgMs, setAvgMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Conversation | null>(null);
  const [show, setShow] = useSearchParamValue("show", "all");
  const unansweredOnly = show === "unanswered";
  const latest = useRef(0);

  const load = useCallback(async () => {
    const call = ++latest.current;
    setLoading(true);
    try {
      const data = await apiFetch<{ stats?: { logs?: Conversation[]; averageLatencyMs?: number } }>(
        `/api/customer/stats${unansweredOnly ? "?unanswered=1" : ""}`,
      );
      if (call !== latest.current) return; // a newer load (filter flipped) owns the list
      setRows(data.stats?.logs ?? []);
      setAvgMs(data.stats?.averageLatencyMs ?? 0);
      setError(null);
    } catch (e) {
      if (call === latest.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (call === latest.current) setLoading(false);
    }
  }, [unansweredOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load on mount and when the filter changes
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => [c.prompt_preview, c.response_preview, c.origin].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, query]);

  return (
    <Card>
      <CardHeader
        title="Visitor conversations"
        description={rows.length ? `Your latest ${rows.length} ${unansweredOnly ? "questions your chatbot couldn't answer" : "conversations"}${avgMs ? `, ${avgMs.toLocaleString()} ms average reply time` : ""}.` : "What visitors asked your chatbot."}
      />
      <CardBody className="grid gap-3">
        {error ? (
          <Alert tone="danger" title="We couldn't load your conversations">
            <p className="mt-1">{error}</p>
            <Button size="sm" variant="secondary" className="mt-3" onClick={load}>Try again</Button>
          </Alert>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full sm:w-auto sm:min-w-48 sm:flex-1">
                <SearchInput aria-label="Search conversations" placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Switch label="Unanswered only" checked={unansweredOnly} onCheckedChange={(on) => setShow(on ? "unanswered" : "all")} />
              <Button variant="secondary" onClick={load} loading={loading} leftIcon={<RefreshCw aria-hidden className="size-4" />}>
                Refresh
              </Button>
              <Button variant="secondary" onClick={() => download(shown)} disabled={shown.length === 0} leftIcon={<Download aria-hidden className="size-4" />}>
                Export CSV
              </Button>
            </div>
            <DataTable
              label="Visitor conversations"
              columns={COLUMNS}
              rows={shown}
              getRowId={(c) => c.id}
              loading={loading && rows.length === 0}
              onRowClick={setOpen}
              empty={
                rows.length === 0 && unansweredOnly ? (
                  <EmptyState
                    icon={MessageCircleQuestion}
                    title="No unanswered questions"
                    description="Your chatbot answered every recent question it was asked."
                    action={<Button variant="secondary" onClick={() => setShow("all")}>Show all conversations</Button>}
                  />
                ) : rows.length === 0 ? (
                  <EmptyState
                    icon={MessageCircleQuestion}
                    title="No conversations yet"
                    description="When visitors chat with your chatbot, their questions show up here."
                    action={<Button variant="secondary" href="/app/install">Install your chatbot</Button>}
                  />
                ) : (
                  <EmptyState title="No conversations match your search" action={<Button variant="secondary" onClick={() => setQuery("")}>Clear search</Button>} />
                )
              }
            />
          </>
        )}
      </CardBody>
      <Drawer open={open !== null} onClose={() => setOpen(null)} title="Conversation" description={open ? `${when(open.timestamp)} · ${open.origin || "Direct"}` : undefined}>
        {open && (
          <dl className="grid gap-4 text-body">
            <div className="grid gap-1">
              <dt className="text-meta font-medium text-text-muted">Question</dt>
              <dd className="whitespace-pre-wrap break-words">{open.prompt_preview || "No question text"}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-meta font-medium text-text-muted">Answer</dt>
              <dd className="whitespace-pre-wrap break-words">{open.response_preview || (answered(open) ? "No answer text" : "The chatbot couldn't answer this one.")}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={result(open).tone}>{result(open).label}</Badge>
              <Badge>{open.latency_ms ?? 0} ms reply time</Badge>
            </div>
          </dl>
        )}
        {open && <p className="mt-4 text-meta text-text-subtle">Only the first 100 characters of each question and answer are saved.</p>}
      </Drawer>
    </Card>
  );
}
