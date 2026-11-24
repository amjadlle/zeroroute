"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, FileText, Globe, Plus, RotateCw, Trash2, Type } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/client/api";
import { cn } from "@/lib/cn";
import { knowledgeSourceLabel } from "@/lib/constants";
import type { KnowledgeDocument } from "@/lib/db/schema";
import { AddKnowledgeDialog } from "./AddKnowledgeDialog";

/** A knowledge source as the API lists it. */
export type KnowledgeSource = Omit<KnowledgeDocument, "customer_key"> & { customer_key?: string };

export type KnowledgeListProps = {
  /** undefined while the first load runs. */
  sources: KnowledgeSource[] | undefined;
  error?: string | null;
  onRetry: () => void;
  /** Admin only: whose knowledge this is. Customers act on their own. */
  targetKey?: string;
  /** Called after a source is added, refreshed or deleted, to reload the list. */
  onChange: () => Promise<unknown>;
  /** Whether the add dialog is open. The page owns it so its header can hold the AddKnowledgeButton. */
  adding: boolean;
  onAddingChange: (open: boolean) => void;
};

/** Opens the add dialog; goes in the page header (and the empty list). */
export function AddKnowledgeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button leftIcon={<Plus aria-hidden className="size-4" />} onClick={onClick}>
      Add knowledge
    </Button>
  );
}

const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong.");
const isWebUrl = (url: string | null | undefined): url is string => !!url && /^https?:\/\//i.test(url);
/** Same icons as the add dialog's source types; unknown types fall back to Text, like knowledgeSourceLabel. */
const typeIcon = (type: string | null | undefined) => (type === "file_upload" ? FileText : type?.startsWith("web_") ? Globe : Type);

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 864e5], ["month", 30 * 864e5], ["week", 7 * 864e5], ["day", 864e5], ["hour", 36e5], ["minute", 6e4],
];

/** "2 days ago", "yesterday", "Just now" for an epoch-ms time. English, like the rest of the console. */
export function timeAgo(ms: number, now = Date.now()): string {
  const diff = ms - now;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) if (Math.abs(diff) >= size) return rtf.format(Math.round(diff / size), unit);
  return "Just now";
}

/** Knowledge sources in a table, with add, refresh (website sources) and delete. Used by both consoles. */
export function KnowledgeList({ sources, error, onRetry, targetKey, onChange, adding, onAddingChange }: KnowledgeListProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const refresh = async (source: KnowledgeSource) => {
    setRefreshing(source.id);
    try {
      await apiFetch("/api/knowledge/crawl", { method: "POST", body: { url: source.source_url, target_key: targetKey } });
      await onChange();
      toast(`Refreshed “${source.title}”.`);
    } catch (e) {
      toast(`Couldn't refresh “${source.title}”: ${message(e)}`, { tone: "danger" });
    } finally {
      setRefreshing(null);
    }
  };

  const remove = (source: KnowledgeSource) =>
    confirm({
      title: "Delete this source?",
      body: `“${source.title}” will be removed and the chatbot will stop using it.`,
      confirmLabel: "Delete",
      tone: "danger",
      // A failure keeps the dialog open and shows the error there.
      onConfirm: async () => {
        const params = new URLSearchParams({ id: source.id });
        if (targetKey) params.set("target_key", targetKey);
        await apiFetch(`/api/knowledge?${params}`, { method: "DELETE" });
        await onChange();
        toast("Source deleted.");
      },
    });

  const columns: Column<KnowledgeSource>[] = [
    {
      key: "title",
      header: "Source",
      sortable: true,
      cell: (s) => {
        const Icon = typeIcon(s.type);
        return (
          <span className="flex min-w-0 items-start justify-end gap-2 sm:justify-start">
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-text-subtle" />
            <span className="grid min-w-0 justify-items-end gap-0.5 sm:justify-items-start">
              <span className="max-w-full truncate font-medium" title={s.title}>{s.title}</span>
              {isWebUrl(s.source_url) && (
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-meta text-text-muted hover:text-accent"
                >
                  <span className="truncate">{s.source_url}</span>
                  <ExternalLink aria-hidden className="size-3 shrink-0" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </span>
          </span>
        );
      },
    },
    { key: "type", header: "Type", cell: (s) => <Badge>{knowledgeSourceLabel(s.type)}</Badge> },
    {
      key: "char_count",
      header: "Size",
      align: "right",
      sortable: true,
      cell: (s) => <span className="whitespace-nowrap text-text-muted">{(s.char_count ?? 0).toLocaleString()} characters</span>,
    },
    {
      // Re-reading a web page rewrites created_at, so this is when the content last changed.
      key: "created_at",
      header: "Updated",
      align: "right",
      sortable: true,
      cell: (s) => (
        <time dateTime={new Date(s.created_at).toISOString()} title={new Date(s.created_at).toLocaleString()} className="whitespace-nowrap text-text-muted">
          {timeAgo(s.created_at)}
        </time>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (s) => (
        <span className="inline-flex gap-1">
          {isWebUrl(s.source_url) && (
            <IconButton
              label={`Refresh “${s.title}” from its web page`}
              icon={<RotateCw aria-hidden className={cn("size-4", refreshing === s.id && "motion-safe:animate-spin")} />}
              disabled={refreshing === s.id}
              onClick={() => refresh(s)}
            />
          )}
          <IconButton label={`Delete “${s.title}”`} icon={<Trash2 aria-hidden className="size-4" />} onClick={() => remove(s)} />
        </span>
      ),
    },
  ];

  return (
    <>
      {error && (
        <Alert tone="danger" title="Couldn't load knowledge" className="mb-4">
          <p>{error}</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>Try again</Button>
        </Alert>
      )}
      {(!error || !!sources?.length) && (
        <Card>
          <DataTable
            label="Knowledge sources"
            columns={columns}
            rows={sources ?? []}
            getRowId={(s) => s.id}
            loading={!sources}
            className="p-2 sm:p-0"
            empty={
              <EmptyState
                icon={BookOpen}
                title="No knowledge yet"
                description="Add a file, a web page or some text. The chatbot answers questions from what you add here."
                action={<AddKnowledgeButton onClick={() => onAddingChange(true)} />}
              />
            }
          />
        </Card>
      )}
      <Alert title="Tip" className="mt-4">
        Short pages with one topic each give better answers than one long document.
      </Alert>
      <AddKnowledgeDialog open={adding} onClose={() => onAddingChange(false)} targetKey={targetKey} onAdded={onChange} />
    </>
  );
}
