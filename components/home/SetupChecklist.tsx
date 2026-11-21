import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { cn } from "@/lib/cn";

// Name every new account gets at signup (app/api/auth/signup/route.ts).
const DEFAULT_BOT_NAME = "ZeroRoute AI";

export type SetupStep = {
  title: string;
  hint: string;
  done: boolean;
  action: { label: string; href: string };
};

type SetupInput = {
  bot_title?: string;
  knowledge_docs_count?: number;
  allowed_domains?: string[];
  monthly_requests?: number;
};

/**
 * The four "get your chatbot live" steps, worked out from the profile.
 * Ceilings: there is no "snippet installed" signal, so "install" counts an allowed domain as done;
 * "test" uses this month's requests, so it shows as pending again for a moment after the monthly reset.
 */
export function setupSteps(p: SetupInput, docsCount = 0): SetupStep[] {
  return [
    {
      title: "Name your chatbot",
      hint: "Pick the name and greeting visitors see.",
      done: Boolean(p.bot_title?.trim()) && p.bot_title !== DEFAULT_BOT_NAME,
      action: { label: "Open Chatbot", href: "/app/chatbot" },
    },
    {
      title: "Teach it about your business",
      hint: "Add a file, a web page or some text it can answer from.",
      done: Math.max(p.knowledge_docs_count ?? 0, docsCount) > 0,
      action: { label: "Add knowledge", href: "/app/knowledge" },
    },
    {
      title: "Put it on your website",
      hint: "Add your website under Allowed domains, then paste the embed snippet. Guides for WordPress, Shopify and Wix.",
      done: (p.allowed_domains?.length ?? 0) > 0,
      action: { label: "Install", href: "/app/install" },
    },
    {
      title: "Ask it a test question",
      hint: "Check the answers sound like you.",
      done: (p.monthly_requests ?? 0) > 0,
      action: { label: "Open test chat", href: "/app/chatbot" },
    },
  ];
}

export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.done).length;
  // Only the first pending step gets the primary button, so there is one obvious next move.
  const next = steps.findIndex((s) => !s.done);
  return (
    <Card>
      <CardHeader
        title="Get your chatbot live"
        description="About 5 minutes. You can change everything later."
        actions={<Badge tone="accent">{`${done} of ${steps.length} done`}</Badge>}
      />
      <CardBody className="grid gap-4">
        <Meter value={done} max={steps.length} label="Setup progress" valueText={`${done} of ${steps.length} steps done`} />
        <ol className="grid gap-1">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-center gap-3 rounded-control py-2">
              <span
                aria-hidden
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-meta font-semibold",
                  s.done ? "bg-success-soft text-success-fg" : "border border-border-strong text-text-muted",
                )}
              >
                {s.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-body font-medium", s.done ? "text-text-muted" : "text-text")}>
                  {s.title}
                  <span className="sr-only">{s.done ? " (done)" : " (to do)"}</span>
                </p>
                {!s.done && <p className="text-meta text-text-muted">{s.hint}</p>}
              </div>
              {!s.done && (
                <Button href={s.action.href} size="sm" variant={i === next ? "primary" : "secondary"}>
                  {s.action.label}
                </Button>
              )}
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
