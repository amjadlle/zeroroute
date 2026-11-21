"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Tabs } from "@/components/ui/Tabs";
import { buildEmbedSnippet } from "@/lib/embedSnippet";

/** The embed snippet as a next/script element. JSX decodes the same entities, so the escaping still holds. */
export const toNextScript = (html: string) =>
  html.replace("<script", "<Script").replace("  defer>\n</script>", '  strategy="lazyOnload"\n/>');

type Guide = {
  value: string;
  label: string;
  steps: string[];
  /** Extra code for platforms that don't take the plain snippet. */
  code?: (botId: string) => { code: string; language: string };
};

export const GUIDES: Guide[] = [
  {
    value: "html",
    label: "Any website",
    steps: [
      "Open the HTML file or template that every page of your site uses.",
      "Paste the embed snippet just before the closing </body> tag.",
      "Save and publish your site.",
    ],
  },
  {
    value: "wordpress",
    label: "WordPress",
    steps: [
      "In your WordPress admin, go to Plugins → Add New and install a header and footer plugin such as WPCode.",
      "Open the plugin's Header & Footer page.",
      "Paste the embed snippet into the Footer box and save.",
    ],
  },
  {
    value: "shopify",
    label: "Shopify",
    steps: [
      "In your Shopify admin, go to Online Store → Themes.",
      "Next to your live theme, open the … menu and choose Edit code.",
      "Open layout/theme.liquid and paste the embed snippet just before </body>.",
      "Click Save.",
    ],
  },
  {
    value: "webflow",
    label: "Webflow",
    steps: [
      "Open Site settings → Custom code.",
      "Paste the embed snippet into the Footer code box.",
      "Save, then publish your site.",
    ],
  },
  {
    value: "nextjs",
    label: "Next.js",
    steps: [
      "Open your root layout, usually app/layout.tsx.",
      'Add import Script from "next/script"; at the top of the file.',
      "Paste the code below inside <body>, after {children}, then deploy.",
    ],
    code: (botId) => ({ code: toNextScript(buildEmbedSnippet({ botId })), language: "tsx" }),
  },
  {
    value: "ai",
    label: "AI coding assistant",
    steps: [
      "Open your project in your coding assistant, such as Cursor, Claude Code or Copilot.",
      "Paste the request below into its chat.",
      "Check the change it makes, then publish your site.",
    ],
    code: (botId) => ({
      language: "text",
      code: `Add this chatbot to every page of my website. Put the script tag just before the closing </body> tag in the shared layout or template. Don't change anything else.\n\n${buildEmbedSnippet({ botId })}`,
    }),
  },
];

export function PlatformGuides({ botId }: { botId: string }) {
  return (
    <Card>
      <CardHeader title="2. Add it to your website" description="Pick where your site is built." />
      <CardBody>
        <Tabs
          label="Platform"
          items={GUIDES.map((guide) => {
            const extra = guide.code?.(botId);
            return {
              value: guide.value,
              label: guide.label,
              content: (
                <div className="space-y-3">
                  <ol className="list-decimal space-y-1.5 pl-5 text-body text-text">
                    {guide.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  {extra && <CodeBlock code={extra.code} language={extra.language} />}
                </div>
              ),
            };
          })}
        />
      </CardBody>
    </Card>
  );
}
