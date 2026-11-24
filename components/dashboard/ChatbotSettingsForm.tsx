"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CircleAlert, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRovingSelection } from "@/components/ui/useRovingSelection";
import { BRAND_COLOR_PRESETS, DEFAULT_BRAND_COLOR, isBrandColor, parseAppearance } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** The chatbot settings the persona API stores. Empty brand_color / logo_url mean the widget defaults. */
export type ChatbotSettings = {
  bot_title: string;
  greeting: string;
  persona: string;
  prompts: string[];
  brand_color: string;
  logo_url: string;
};

export const MAX_SUGGESTED_QUESTIONS = 6;

const SWATCHES = [{ name: "Default", value: DEFAULT_BRAND_COLOR }, ...BRAND_COLOR_PRESETS];

/** Validation message per appearance field, or undefined when valid. */
export function appearanceErrors(v: Pick<ChatbotSettings, "brand_color" | "logo_url">) {
  const err = (f: "brand_color" | "logo_url") => {
    const r = parseAppearance(f, v[f]);
    return "error" in r ? r.error : undefined;
  };
  return { brand_color: err("brand_color"), logo_url: err("logo_url") };
}

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
  const errors = appearanceErrors(value);
  // Focus a chip only when the person just added it, not on first render.
  const [added, setAdded] = useState(false);
  const colorId = useId();
  const colorHelpId = `${colorId}-help`;
  // The colour visitors will see: the typed one if valid, otherwise the widget default.
  const shown = isBrandColor(value.brand_color) ? value.brand_color.trim().toLowerCase() : DEFAULT_BRAND_COLOR;
  // The default swatch clears the field, so the widget keeps following its own default.
  const swatches = useRovingSelection({
    values: SWATCHES.map((c) => c.value),
    value: errors.brand_color ? "" : shown,
    onValueChange: (c) => set({ brand_color: c === DEFAULT_BRAND_COLOR ? "" : c }),
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (!errors.brand_color && !errors.logo_url) onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" hint="Shown at the top of the chat window." required>
          <Input value={value.bot_title} onChange={(e) => set({ bot_title: e.target.value })} maxLength={100} placeholder="Support assistant" />
        </Field>
        <Field label="Greeting" hint="The first message visitors see." required>
          <Input value={value.greeting} onChange={(e) => set({ greeting: e.target.value })} maxLength={500} placeholder="Hi there! How can I help?" />
        </Field>
      </div>
      <Field label="Instructions" hint="Tone, what to avoid, and who to send visitors to. Plain language works best.">
        <Textarea
          rows={6}
          value={value.persona}
          onChange={(e) => set({ persona: e.target.value })}
          maxLength={10000}
          placeholder="Answer questions about our products in a friendly, short way. If you don't know, offer our support email."
        />
      </Field>

      <div className="grid gap-1.5">
        <label htmlFor={colorId} className="text-body font-medium text-text">Brand colour</label>
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Preset colours" className="flex flex-wrap gap-2">
            {SWATCHES.map((c, i) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-label={c.name}
                title={c.name}
                aria-checked={c.value === swatches.selected}
                tabIndex={c.value === swatches.tabStop ? 0 : -1}
                onClick={() => swatches.select(c.value)}
                onKeyDown={(e) => swatches.onKeyDown(e, i)}
                // User data (the widget's brand colour), not console styling.
                style={{ backgroundColor: c.value }}
                className={cn(
                  "size-7 cursor-pointer rounded-full border-2 border-surface ring-1 ring-border pointer-coarse:size-11",
                  "aria-checked:ring-2 aria-checked:ring-text",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick any colour"
              value={shown}
              onChange={(e) => set({ brand_color: e.target.value })}
              className="h-control-md w-10 shrink-0 cursor-pointer rounded-control border border-border-strong bg-surface-sunken p-0.5 focus-visible:outline-2 focus-visible:outline-focus-ring"
            />
            {/* Input is w-full; the wrapper sets its width (cn() doesn't resolve class conflicts). */}
            <div className="w-28">
              <Input
                id={colorId}
                value={value.brand_color}
                onChange={(e) => set({ brand_color: e.target.value })}
                maxLength={7}
                placeholder={DEFAULT_BRAND_COLOR}
                aria-describedby={colorHelpId}
                aria-invalid={errors.brand_color ? true : undefined}
                className="font-ui-mono"
              />
            </div>
          </div>
        </div>
        {errors.brand_color ? (
          <p id={colorHelpId} className="flex items-center gap-1.5 text-meta text-danger-fg">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            {errors.brand_color}
          </p>
        ) : (
          <p id={colorHelpId} className="text-meta text-text-muted">Colours the chat button and header. Pick one, or type a hex code.</p>
        )}
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-body font-medium text-text">Suggested questions</legend>
        <div className="flex flex-wrap items-center gap-2">
          {value.prompts.map((p, i) => (
            <span
              key={i}
              className="inline-flex h-8 max-w-full items-center rounded-full border border-border-strong bg-surface-sunken pl-3 pr-0.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus-ring pointer-coarse:h-11"
            >
              {/* The chip's ring shows focus; field-sizing grows the chip with its text. */}
              <input
                aria-label={`Suggested question ${i + 1}`}
                value={p}
                onChange={(e) => setPrompt(i, e.target.value)}
                maxLength={200}
                placeholder="Type a question"
                autoFocus={added && i === value.prompts.length - 1}
                className="field-sizing-content min-w-24 max-w-full bg-transparent text-base text-text outline-none placeholder:text-text-subtle md:text-body"
              />
              <button
                type="button"
                aria-label={`Remove suggested question ${i + 1}`}
                title="Remove"
                onClick={() => set({ prompts: value.prompts.filter((_, n) => n !== i) })}
                className="ml-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-muted hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring pointer-coarse:size-10"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          ))}
          {value.prompts.length < MAX_SUGGESTED_QUESTIONS && (
            <button
              type="button"
              onClick={() => {
                setAdded(true);
                set({ prompts: [...value.prompts, ""] });
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-border-strong px-3 text-body text-text-muted hover:border-text-subtle hover:text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring pointer-coarse:h-11"
            >
              <Plus aria-hidden className="size-3.5" />
              Add question
            </button>
          )}
        </div>
        <p className="text-meta text-text-muted">Shown to visitors before they type. Up to {MAX_SUGGESTED_QUESTIONS}.</p>
      </fieldset>

      <Field label="Logo" hint="Web address of an image shown on the chat button and header." error={errors.logo_url}>
        <Input type="url" value={value.logo_url} onChange={(e) => set({ logo_url: e.target.value })} maxLength={500} placeholder="https://example.com/logo.png" />
      </Field>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button type="submit" loading={saving}>{submitLabel}</Button>
        {actions}
      </div>
    </form>
  );
}
