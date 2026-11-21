"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, MessageSquare } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client/api";

type LogItem = { id: string; timestamp: number; origin?: string; prompt_preview?: string; status?: number };

const SHOWN = 5;
const when = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** The latest visitor questions from /api/customer/stats. A failed load says so instead of looking empty. */
export function RecentQuestions() {
  const [logs, setLogs] = useState<LogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<{ stats?: { logs?: LogItem[] } }>("/api/customer/stats");
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
      <Alert tone="danger" title="Couldn't load recent questions" className="m-4.5">
        <p>{error}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={load}>Try again</Button>
      </Alert>
    );
  } else if (!logs) {
    body = (
      <div className="grid gap-2 p-4.5" aria-busy="true">
        <span className="sr-only">Loading recent questions</span>
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
    body = (
      <ul className="divide-y divide-border">
        {logs.slice(0, SHOWN).map((l) => (
          <li key={l.id} className="flex items-center gap-3 px-4.5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body">{l.prompt_preview || "(no text)"}</p>
              <p className="truncate text-meta text-text-muted">
                {when.format(l.timestamp)}
                {l.origin ? ` · ${l.origin}` : ""}
              </p>
            </div>
            {l.status !== undefined && l.status >= 400 && <Badge tone="danger">Failed</Badge>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Recent questions"
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
