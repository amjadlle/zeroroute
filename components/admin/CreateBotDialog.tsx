"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client/api";
import { buildEmbedSnippet } from "@/lib/embedSnippet";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SecretField } from "@/components/ui/SecretField";

// eslint-disable-next-line no-restricted-syntax -- user data (widget brand colour), not console styling
const DEFAULT_COLOR = "#ef4444"; // widget.js default, so an untouched picker changes nothing
const HEX = /^#[0-9a-f]{6}$/i;

const EMPTY = {
  company: "",
  domains: "",
  title: "",
  color: DEFAULT_COLOR,
  logo: "",
  greeting: "Hi! 👋 How can I help you today?",
  prompts: "What services do you offer?, How do I get started?, What are your pricing plans?",
};

type Created = { botId: string; key: string; snippet: string; domains: string };

type CreateBotDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Called after the server confirms the new chatbot. */
  onCreated: () => unknown;
};

/** Creates an unlimited chatbot for one of the admin's own sites, then shows its embed snippet and API key. */
export function CreateBotDialog({ open, onClose, onCreated }: CreateBotDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const colorError = HEX.test(form.color) ? undefined : "Use a hex colour like #2563eb.";

  const reset = () => {
    setForm(EMPTY);
    setError(null);
    setCreated(null);
  };
  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (colorError) return;
    setSubmitting(true);
    setError(null);
    const company = form.company.trim();
    const title = form.title.trim() || `${company} chatbot`;
    const prompts = form.prompts.split(",").map((p) => p.trim()).filter(Boolean);
    try {
      const data = await apiFetch<{ bot?: { bot_id: string; key: string } }>("/api/admin/customers", {
        method: "POST",
        body: {
          company,
          name: company,
          bot_title: title,
          website: form.domains.split(",")[0]?.trim() || "",
          allowed_domains: form.domains.trim(),
          greeting: form.greeting.trim(),
          prompts,
        },
      });
      if (!data.bot) throw new Error("The server did not return the new chatbot.");
      setCreated({
        botId: data.bot.bot_id,
        key: data.bot.key,
        domains: form.domains.trim(),
        // Brand colour and logo have no column yet, so they live only in this snippet.
        snippet: buildEmbedSnippet({
          botId: data.bot.bot_id,
          title,
          color: form.color,
          logo: form.logo.trim(),
          greeting: form.greeting.trim(),
          prompts,
        }),
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Could not create the chatbot. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <Modal
        open={open}
        onClose={close}
        size="lg"
        title="Chatbot created"
        description="It has no request limit. Paste the snippet before the closing </body> tag of your site."
        footer={
          <>
            <Button variant="secondary" onClick={reset}>Create another</Button>
            <Button onClick={close}>Done</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <CodeBlock code={created.snippet} language="html" />
          <Alert tone="warning">Copy the snippet now: the brand colour and logo are not saved with the chatbot.</Alert>
          <dl className="grid gap-3">
            <div className="grid gap-1.5">
              <dt className="font-medium">Bot ID</dt>
              <dd className="font-ui-mono text-text-muted">{created.botId}</dd>
            </div>
            <div className="grid gap-1.5">
              <dt className="font-medium">Allowed domains</dt>
              <dd className="text-text-muted">{created.domains || "Any website"}</dd>
            </div>
            <div className="grid gap-1.5">
              <dt className="font-medium">API key</dt>
              <dd><SecretField value={created.key} label="API key" /></dd>
            </div>
          </dl>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Create a chatbot"
      description="A free chatbot with no request limit, for your own websites."
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="create-bot-form" loading={submitting}>Create chatbot</Button>
        </>
      }
    >
      <form id="create-bot-form" onSubmit={submit} className="grid gap-4">
        {error && <Alert tone="danger" title="Chatbot not created">{error}</Alert>}
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field label="Website or project name" required>
            <Input value={form.company} onChange={set("company")} placeholder="My portfolio" />
          </Field>
          <Field label="Name" hint="Shown in the chatbot header. Defaults to the project name.">
            <Input value={form.title} onChange={set("title")} placeholder="Support" />
          </Field>
        </div>
        <Field label="Allowed domains" hint="Comma-separated, for example mysite.com, blog.mysite.com. Leave empty to allow any website.">
          <Input value={form.domains} onChange={set("domains")} placeholder="mysite.com" />
        </Field>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Field label="Brand colour" error={colorError} className="flex-1">
              <Input value={form.color} onChange={set("color")} className="font-ui-mono" />
            </Field>
            <input
              type="color"
              aria-label="Pick brand colour"
              value={HEX.test(form.color) ? form.color : DEFAULT_COLOR}
              onChange={set("color")}
              className="mt-7 h-control-md w-12 shrink-0 cursor-pointer rounded-control border border-border-strong bg-surface-sunken p-0.5"
            />
          </div>
          <Field label="Logo URL" hint="Optional. An https image URL.">
            <Input type="url" value={form.logo} onChange={set("logo")} placeholder="https://mysite.com/logo.png" />
          </Field>
        </div>
        <Field label="Greeting">
          <Input value={form.greeting} onChange={set("greeting")} />
        </Field>
        <Field label="Suggested questions" hint="Comma-separated.">
          <Input value={form.prompts} onChange={set("prompts")} />
        </Field>
      </form>
    </Modal>
  );
}
