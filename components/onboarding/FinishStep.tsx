import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SecretField } from "@/components/ui/SecretField";
import { buildEmbedSnippet } from "@/lib/embedSnippet";

type FinishStepProps = {
  apiKey: string;
  botId: string;
  actions?: ReactNode;
};

/** Everything is already saved; this step hands over the embed snippet and API key. */
export function FinishStep({ apiKey, botId, actions }: FinishStepProps) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-2">
        <h3 className="font-semibold">Add the chatbot to your website</h3>
        <p className="text-text-muted">
          Paste this just before the closing <code className="font-ui-mono">&lt;/body&gt;</code> tag. Your chatbot&apos;s settings load
          automatically, so you won&apos;t need to change it later.
        </p>
        <CodeBlock code={buildEmbedSnippet({ botId })} language="html" />
      </section>
      <section className="grid gap-2">
        <h3 className="font-semibold">Your API key</h3>
        <p className="text-text-muted">For calling the API from your own code. Keep it private.</p>
        <SecretField value={apiKey} label="API key" />
      </section>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button href="/app">Go to your console</Button>
        {actions}
      </div>
    </div>
  );
}
