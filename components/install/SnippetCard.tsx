import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { buildEmbedSnippet } from "@/lib/embedSnippet";

export const linkClass =
  "rounded-sm text-accent underline underline-offset-2 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function SnippetCard({ botId }: { botId: string }) {
  return (
    <Card>
      <CardHeader title="1. Copy your embed snippet" description="This one line of code shows your chatbot on every page it's added to." />
      <CardBody className="space-y-3">
        <CodeBlock code={buildEmbedSnippet({ botId })} language="html" />
        <p className="text-body text-text-muted">
          Your chatbot&apos;s name, greeting and suggested questions load from{" "}
          <Link href="/app/chatbot" className={linkClass}>Chatbot settings</Link>, so you don&apos;t need to change this code when you edit them.
        </p>
      </CardBody>
    </Card>
  );
}
