"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, MessageSquare } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { conversationResult, type Conversation } from "@/components/dashboard/VisitorConversations";
import { apiFetch } from "@/lib/client/api";

const SHOWN = 6;
const when = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

const COLUMNS: Column<Conversation>[] = [
  { key: "prompt_preview", header: "Question", cell: (c) => <span className="line-clamp-2">{c.prompt_preview || "No question text"}</span> },
  { key: "status", header: "Result", cell: (c) => <Badge tone={conversationResult(c).tone}>{conversationResult(c).label}</Badge> },
  { key: "origin", header: "Website", cell: (c) => <span className="break-all text-text-muted">{c.origin || "Direct"}</span> },
  { key: "timestamp", header: "When", align: "right", cell: (c) => <span className="whitespace-nowrap text-text-muted tabular-nums">{when.format(c.timestamp)}</span> },
];

/** The latest visitor conversations from /api/customer/stats. A failed load says so instead of looking empty. */
export function RecentConversations() {
  const [logs, setLogs] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<{ stats?: { logs?: Conversation[] } }>("/api/customer/stats");
      setLogs(data.stats?.logs ?? []);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Something went wrong.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load();
  }, [load]);

  let body;
  if (error) {
    body = (
      <Alert tone="danger" title="Couldn't load recent conversations" className="m-4.5">
        <p>{error}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={load}>Try again</Button>
      </Alert>
    );
  } else if (!logs) {
    body = (
      <div className="grid gap-2 p-4.5" aria-busy="true">
        <span className="sr-only">Loading recent conversations</span>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
      </div>
    );
  } else if (logs.length === 0) {
    body = (
      <EmptyState
        icon={MessageSquare}
        title="No questions yet"
        description="When visitors ask your chatbot something, the latest questions show up here."
        action={<Button href="/app/chatbot" variant="secondary" size="sm">Ask a test question</Button>}
      />
    );
  } else {
    body = <DataTable label="Recent conversations" columns={COLUMNS} rows={logs.slice(0, SHOWN)} getRowId={(c) => c.id} className="max-sm:p-3" />;
  }

  return (
    <Card>
      <CardHeader
        title="Recent conversations"
        actions={
          <Button href="/app/usage" variant="ghost" size="sm" rightIcon={<ChevronRight aria-hidden className="size-3.5" />}>
            View all
          </Button>
        }
      />
      {body}
    </Card>
  );
}
