"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { ChatPanel } from "@/components/shared/chat/ChatPanel";
import { useChatStream } from "@/components/shared/chat/useChatStream";
import type { ProviderItem } from "./AdminProvidersTab";

/**
 * Gateway test bench: pick a model, optionally add instructions, chat. Persona editing was dropped here (#18):
 * customers edit their own chatbot settings, and the old save had no target customer.
 */
export function AdminPlaygroundTab({ providers }: { providers: ProviderItem[] }) {
  const [model, setModel] = useState("auto");
  const [system, setSystem] = useState("");
  const [stream, setStream] = useState(true);
  const chat = useChatStream({ model, system, stream });
  const { meta } = chat;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <Card className="self-start">
        <CardHeader title="Test settings" description="Applies to the next message." />
        <CardBody className="grid gap-4">
          {/* Native select: arrow keys, type-ahead and screen readers work out of the box. */}
          <Field label="Model" hint="Automatic tries providers in order until one answers.">
            <Select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="auto">Automatic (fallback order)</option>
              {providers.map((p) => (
                <optgroup key={p.id} label={p.configured ? p.name : `${p.name} (no key)`}>
                  {(p.models?.length ? p.models : [p.model]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="Instructions" hint="Optional. Sent with each test message, never saved.">
            <Textarea value={system} onChange={(e) => setSystem(e.target.value)} placeholder="Answer in one short sentence." />
          </Field>
          <Switch label="Stream the reply" checked={stream} onCheckedChange={setStream} />
          {meta && (
            <div className="flex flex-wrap gap-1.5">
              <span className="sr-only">Last reply:</span>
              {meta.provider && <Badge tone="info">{meta.provider}</Badge>}
              {meta.model && <Badge>{meta.model}</Badge>}
              <Badge tone="success">{meta.latencyMs} ms</Badge>
            </div>
          )}
        </CardBody>
      </Card>
      <ChatPanel chat={chat} title="Conversation" description="Messages go through the gateway like a real request." placeholder="Ask anything to test routing" />
    </div>
  );
}
