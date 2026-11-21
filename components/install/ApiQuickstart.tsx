"use client";

import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { CopyButton } from "@/components/ui/CopyButton";
import { SecretField } from "@/components/ui/SecretField";
import { Tabs } from "@/components/ui/Tabs";
import { PROVIDER_COUNT, SITE_URL } from "@/lib/constants";

const BASE_URL = `${SITE_URL}/v1`;

// Examples read the key from an environment variable so it never sits in shared code or on screen.
const EXAMPLES = [
  {
    value: "curl",
    label: "curl",
    language: "bash",
    code: `curl ${BASE_URL}/chat/completions \\
  -H "Authorization: Bearer $ZEROROUTE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Hello!"}]}'`,
  },
  {
    value: "js",
    label: "JavaScript",
    language: "js",
    code: `const res = await fetch("${BASE_URL}/chat/completions", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.ZEROROUTE_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "auto",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});
const data = await res.json();
console.log(data.choices[0].message.content);`,
  },
  {
    value: "python",
    label: "Python",
    language: "python",
    code: `# pip install openai
import os
from openai import OpenAI

client = OpenAI(base_url="${BASE_URL}", api_key=os.environ["ZEROROUTE_API_KEY"])

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)`,
  },
];

export function ApiQuickstart({ apiKey }: { apiKey: string }) {
  return (
    <Card>
      <CardHeader
        title="Use the API"
        description={`Call ZeroRoute from your own code. It works with OpenAI client libraries, picks from ${PROVIDER_COUNT} AI providers and switches automatically if one fails.`}
      />
      <CardBody className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <dt className="text-body font-medium text-text">API key</dt>
            <dd><SecretField value={apiKey} label="API key" /></dd>
          </div>
          <div className="grid min-w-0 gap-1.5">
            <dt className="text-body font-medium text-text">Base URL</dt>
            <dd className="flex min-w-0 items-center gap-1 rounded-control border border-border bg-surface-sunken py-0.5 pr-0.5 pl-3">
              <code className="min-w-0 flex-1 truncate font-ui-mono text-body text-text">{BASE_URL}</code>
              <CopyButton value={BASE_URL} label="Copy base URL" />
            </dd>
          </div>
        </dl>
        <Alert title="Keep your API key on your server">
          Never put it in website code, where anyone can read it. Your website uses the embed snippet instead.
        </Alert>
        <Tabs
          label="Language"
          items={EXAMPLES.map(({ value, label, language, code }) => ({
            value,
            label,
            content: <CodeBlock code={code} language={language} />,
          }))}
        />
      </CardBody>
    </Card>
  );
}
