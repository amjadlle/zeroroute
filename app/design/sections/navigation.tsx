"use client";

import { useState } from "react";
import { CircleCheck, CircleX, List } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tabs } from "@/components/ui/Tabs";

const LOGS = [
  { id: "req_81f2", status: "ok", text: "openai · gpt-4o-mini · 412 ms" },
  { id: "req_81f3", status: "failed", text: "groq · llama-3.3-70b · 502 upstream" },
  { id: "req_81f4", status: "ok", text: "cerebras · k2-horizon · 198 ms" },
  { id: "req_81f5", status: "ok", text: "mistral · small · 640 ms" },
] as const;

const icon = "size-3.5";

export default function NavigationSection() {
  const [filter, setFilter] = useState("all");
  const rows = filter === "all" ? LOGS : LOGS.filter((log) => log.status === filter);

  return (
    <div className="grid gap-8 text-body text-text">
      <div>
        <h3 className="mb-2 text-meta text-text-subtle">Tabs (arrow keys, Home, End)</h3>
        <Tabs
          label="Install method"
          items={[
            { value: "html", label: "Any website", content: <p className="text-text-muted">Paste one script tag before the closing body tag.</p> },
            { value: "react", label: "Next.js / React", content: <p className="text-text-muted">Add the widget component to your root layout.</p> },
            { value: "api", label: "API", content: <p className="text-text-muted">Call the chat completions endpoint with your API key.</p> },
          ]}
        />
      </div>

      <div className="grid gap-3">
        <h3 className="text-meta text-text-subtle">Segmented control (filter)</h3>
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl
            label="Request status"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "all", label: "All", icon: <List className={icon} /> },
              { value: "ok", label: "Succeeded", icon: <CircleCheck className={icon} /> },
              { value: "failed", label: "Failed", icon: <CircleX className={icon} /> },
            ]}
          />
          <SegmentedControl
            label="Range"
            size="sm"
            defaultValue="24h"
            options={[
              { value: "1h", label: "1h" },
              { value: "24h", label: "24h" },
              { value: "7d", label: "7d" },
            ]}
          />
        </div>
        <p className="text-meta text-text-muted" aria-live="polite">
          Showing {rows.length} of {LOGS.length} requests
        </p>
        <ul className="grid gap-1 font-ui-mono text-meta">
          {rows.map((log) => (
            <li key={log.id} className={log.status === "failed" ? "text-danger-fg" : "text-text-muted"}>
              {log.id} {log.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
