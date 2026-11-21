"use client";

import { useState, type ReactNode } from "react";
import { FileText, Plus } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { AddKnowledgeDialog } from "@/components/shared/knowledge/AddKnowledgeDialog";
import type { KnowledgeSource } from "@/components/shared/knowledge/KnowledgeList";
import { knowledgeSourceLabel } from "@/lib/constants";

type KnowledgeStepProps = {
  /** undefined while loading. */
  sources: KnowledgeSource[] | undefined;
  error?: string | null;
  onRetry: () => void;
  /** Reloads the list after the dialog added a source. */
  onAdded: () => Promise<unknown>;
  onContinue: () => void;
  actions?: ReactNode;
};

/** Add knowledge through the shared dialog. Each source is saved when added, so Continue saves nothing. */
export function KnowledgeStep({ sources, error, onRetry, onAdded, onContinue, actions }: KnowledgeStepProps) {
  const [adding, setAdding] = useState(false);
  const count = sources?.length ?? 0;

  return (
    <div className="grid gap-4">
      {error ? (
        <Alert tone="danger" title="Couldn't load your knowledge.">
          <p>{error}</p>
          <Button variant="link" onClick={onRetry}>Try again</Button>
        </Alert>
      ) : count > 0 ? (
        <ul className="grid gap-1.5" aria-label="Knowledge sources">
          {sources!.map((s) => (
            <li key={s.id} className="flex min-w-0 items-center gap-2.5 rounded-control border border-border bg-surface-sunken px-3 py-2">
              <FileText aria-hidden className="size-4 shrink-0 text-text-subtle" />
              <span className="min-w-0 flex-1 truncate">{s.title}</span>
              <span className="shrink-0 text-meta text-text-muted">{knowledgeSourceLabel(s.type)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted">
          {sources ? "Nothing added yet. Add a file, a web page or some text, or skip this and add knowledge later." : "Loading your knowledge…"}
        </p>
      )}

      <Button variant="secondary" className="justify-self-start" leftIcon={<Plus aria-hidden className="size-4" />} onClick={() => setAdding(true)}>
        Add knowledge
      </Button>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button onClick={onContinue}>{count > 0 ? "Continue" : "Skip for now"}</Button>
        {actions}
      </div>

      <AddKnowledgeDialog open={adding} onClose={() => setAdding(false)} onAdded={onAdded} />
    </div>
  );
}
