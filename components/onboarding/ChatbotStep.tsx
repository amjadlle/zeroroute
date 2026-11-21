"use client";

import type { FormEvent, ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

// TODO(#26): replace with components/dashboard/ChatbotSettingsForm from PR #80 once it lands (adds brand colour and logo).
export type ChatbotSettings = { bot_title: string; greeting: string; persona: string; prompts: string[] };

const MAX_QUESTIONS = 6;

type ChatbotStepProps = {
  value: ChatbotSettings;
  onChange: (value: ChatbotSettings) => void;
  onSubmit: () => void;
  saving?: boolean;
  actions?: ReactNode;
};

export function ChatbotStep({ value, onChange, onSubmit, saving, actions }: ChatbotStepProps) {
  const set = (patch: Partial<ChatbotSettings>) => onChange({ ...value, ...patch });
  return (
    <form className="grid gap-4" onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(); }}>
      <Field label="Name" hint="Shown in the chat header." required>
        <Input value={value.bot_title} onChange={(e) => set({ bot_title: e.target.value })} maxLength={100} />
      </Field>
      <Field label="Greeting" hint="The first message visitors see." required>
        <Input value={value.greeting} onChange={(e) => set({ greeting: e.target.value })} maxLength={500} />
      </Field>
      <Field label="Instructions" hint="How the chatbot should behave and what tone to use.">
        <Textarea rows={5} value={value.persona} onChange={(e) => set({ persona: e.target.value })} maxLength={10000} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-body font-medium text-text">Suggested questions</legend>
        {value.prompts.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input aria-label={`Suggested question ${i + 1}`} value={p} maxLength={200}
              onChange={(e) => set({ prompts: value.prompts.map((q, n) => (n === i ? e.target.value : q)) })} />
            <IconButton label={`Remove suggested question ${i + 1}`} icon={<X aria-hidden className="size-4" />}
              onClick={() => set({ prompts: value.prompts.filter((_, n) => n !== i) })} />
          </div>
        ))}
        {value.prompts.length < MAX_QUESTIONS && (
          <Button variant="secondary" size="sm" className="justify-self-start" leftIcon={<Plus aria-hidden className="size-3.5" />}
            onClick={() => set({ prompts: [...value.prompts, ""] })}>
            Add question
          </Button>
        )}
      </fieldset>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" loading={saving}>Save and continue</Button>
        {actions}
      </div>
    </form>
  );
}
