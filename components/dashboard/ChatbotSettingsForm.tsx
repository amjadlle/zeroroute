"use client";

import type { FormEvent, ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

/** The chatbot settings the persona API stores. Brand colour and logo have no backend column yet. */
export type ChatbotSettings = { bot_title: string; greeting: string; persona: string; prompts: string[] };

export const MAX_SUGGESTED_QUESTIONS = 6;

type ChatbotSettingsFormProps = {
  value: ChatbotSettings;
  onChange: (value: ChatbotSettings) => void;
  onSubmit: () => void;
  saving?: boolean;
  submitLabel?: string;
  /** Extra controls next to the submit button (e.g. Back in onboarding). */
  actions?: ReactNode;
};

/** Controlled form for chatbot settings; the caller saves. Shared by the Chatbot page and onboarding. */
export function ChatbotSettingsForm({ value, onChange, onSubmit, saving, submitLabel = "Save changes", actions }: ChatbotSettingsFormProps) {
  const set = (patch: Partial<ChatbotSettings>) => onChange({ ...value, ...patch });
  const setPrompt = (i: number, text: string) => set({ prompts: value.prompts.map((p, n) => (n === i ? text : p)) });

  return (
    <form
      className="grid gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field label="Name" hint="Shown in the chat header." required>
        <Input value={value.bot_title} onChange={(e) => set({ bot_title: e.target.value })} maxLength={100} placeholder="Support assistant" />
      </Field>
      <Field label="Greeting" hint="The first message visitors see." required>
        <Input value={value.greeting} onChange={(e) => set({ greeting: e.target.value })} maxLength={500} placeholder="Hi there! How can I help you today?" />
      </Field>
      <Field label="Instructions" hint="How the chatbot should behave and what tone to use. Plain language works best.">
        <Textarea
          rows={6}
          value={value.persona}
          onChange={(e) => set({ persona: e.target.value })}
          maxLength={10000}
          placeholder="Answer questions about our products in a friendly, short way. If you don't know, offer our support email."
        />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-body font-medium text-text">Suggested questions</legend>
        <p className="text-meta text-text-muted">Shown to visitors before they type. Up to {MAX_SUGGESTED_QUESTIONS}.</p>
        {value.prompts.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input aria-label={`Suggested question ${i + 1}`} value={p} onChange={(e) => setPrompt(i, e.target.value)} maxLength={200} />
            <IconButton
              label={`Remove suggested question ${i + 1}`}
              icon={<X aria-hidden className="size-4" />}
              onClick={() => set({ prompts: value.prompts.filter((_, n) => n !== i) })}
            />
          </div>
        ))}
        {value.prompts.length < MAX_SUGGESTED_QUESTIONS && (
          <Button
            variant="secondary"
            size="sm"
            className="justify-self-start"
            leftIcon={<Plus aria-hidden className="size-3.5" />}
            onClick={() => set({ prompts: [...value.prompts, ""] })}
          >
            Add question
          </Button>
        )}
      </fieldset>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" loading={saving}>{submitLabel}</Button>
        {actions}
      </div>
    </form>
  );
}
