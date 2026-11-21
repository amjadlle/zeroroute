"use client";

import { useId, useState, type DragEvent, type FormEvent } from "react";
import { FileText, Globe, Type, UploadCloud } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/client/api";
import { cn } from "@/lib/cn";

type Mode = "file" | "website" | "text";

const MODES = [
  { value: "file", label: "File", icon: <FileText className="size-4" /> },
  { value: "website", label: "Website", icon: <Globe className="size-4" /> },
  { value: "text", label: "Text", icon: <Type className="size-4" /> },
] as const;

const FILE_TYPES = [".md", ".markdown", ".txt", ".json"];
/** Same cap the website reader applies to a page (lib/crawler MAX_BODY_BYTES), and well under the hosting request limit. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Returns why a file can't be added, or null when it can. */
export function fileProblem(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!FILE_TYPES.some((ext) => name.endsWith(ext))) return "Choose a .md, .txt or .json file.";
  if (file.size > MAX_FILE_BYTES) return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 2 MB.`;
  if (file.size === 0) return "This file is empty.";
  return null;
}

type AddKnowledgeDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Admin only: the customer to add knowledge for. */
  targetKey?: string;
  /** Called after a source was added. */
  onAdded: () => Promise<unknown>;
};

/** One dialog for every way to add knowledge: a file, a web page or pasted text. */
export function AddKnowledgeDialog({ open, onClose, targetKey, onAdded }: AddKnowledgeDialogProps) {
  const toast = useToast();
  const formId = useId();
  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setUrl("");
    setTitle("");
    setContent("");
    setError(null);
  };

  const close = () => {
    if (pending) return;
    setError(null);
    onClose();
  };

  const pick = (picked: File | undefined) => {
    if (!picked) return;
    const problem = fileProblem(picked);
    setFile(problem ? null : picked);
    setError(problem);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!pending) pick(e.dataTransfer.files[0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      let added: string;
      if (mode === "file") {
        if (!file) throw new Error("Choose a file first.");
        const text = await file.text();
        if (!text.trim()) throw new Error("This file has no text in it.");
        await apiFetch("/api/knowledge", { method: "POST", body: { title: file.name, content: text, type: "file_upload", target_key: targetKey } });
        added = file.name;
      } else if (mode === "website") {
        const trimmed = url.trim();
        const full = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        await apiFetch("/api/knowledge/crawl", { method: "POST", body: { url: full, title: title.trim() || undefined, target_key: targetKey } });
        added = title.trim() || full;
      } else {
        await apiFetch("/api/knowledge", { method: "POST", body: { title: title.trim(), content: content.trim(), type: "manual_text", target_key: targetKey } });
        added = title.trim();
      }
      await onAdded();
      toast(`Added “${added}”.`);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  };

  const changeMode = (next: string) => {
    setMode(next as Mode);
    setError(null);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add knowledge"
      description="The chatbot answers questions from what you add."
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={pending}>Cancel</Button>
          <Button type="submit" form={formId} loading={pending} disabled={mode === "file" && !file}>
            Add
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="grid gap-4">
        <SegmentedControl label="Source type" options={MODES} value={mode} onValueChange={changeMode} className="justify-self-start" />

        {mode === "file" && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "grid cursor-pointer justify-items-center gap-2 rounded-card border-2 border-dashed px-4 py-8 text-center transition-colors",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring",
              dragging ? "border-accent bg-accent-soft" : "border-border-strong bg-surface-sunken hover:border-text-subtle",
            )}
          >
            <input
              type="file"
              accept={FILE_TYPES.join(",")}
              className="sr-only"
              disabled={pending}
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = ""; // lets the same file be picked again
              }}
            />
            <UploadCloud aria-hidden className="size-7 text-text-subtle" />
            <span className="font-medium">{file ? file.name : "Choose a file or drop it here"}</span>
            <span className="text-meta text-text-muted">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Markdown, plain text or JSON, up to 2 MB"}
            </span>
          </label>
        )}

        {mode === "website" && (
          <>
            <Field label="Web address" hint="A public web page, Google Doc, Notion page or GitHub file." required>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" autoComplete="url" placeholder="https://example.com/faq" />
            </Field>
            <Field label="Name" hint="Leave empty to use the page title.">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </>
        )}

        {mode === "text" && (
          <>
            <Field label="Name" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Return policy" />
            </Field>
            <Field label="Text" required>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Paste questions and answers, policies or product details." />
            </Field>
          </>
        )}

        {error && <Alert tone="danger">{error}</Alert>}
      </form>
    </Modal>
  );
}
