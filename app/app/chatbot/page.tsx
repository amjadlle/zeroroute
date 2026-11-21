"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ChatbotSettingsForm, type ChatbotSettings } from "@/components/dashboard/ChatbotSettingsForm";
import { ChatPanel } from "@/components/shared/chat/ChatPanel";
import { useChatStream } from "@/components/shared/chat/useChatStream";
import { apiFetch } from "@/lib/client/api";
import { failMsg, useCustomer } from "../CustomerConsole";

export default function ChatbotPage() {
  const toast = useToast();
  const { profile, refreshProfile } = useCustomer();
  const saved: ChatbotSettings = {
    bot_title: profile.bot_title,
    greeting: profile.greeting,
    persona: profile.persona,
    prompts: profile.prompts ?? [],
  };
  const [settings, setSettings] = useState(saved);
  const [saving, setSaving] = useState(false);
  // Same-origin session cookie: the gateway answers with this customer's saved settings and knowledge.
  const chat = useChatStream();

  const prompts = settings.prompts.map((p) => p.trim()).filter(Boolean);
  const dirty = JSON.stringify({ ...settings, prompts }) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/customer/persona", { method: "POST", body: { ...settings, prompts } });
      await refreshProfile();
      setSettings((s) => ({ ...s, prompts }));
      toast("Chatbot settings saved.");
    } catch (e) {
      toast(`Couldn't save your chatbot settings: ${failMsg(e)}`, { tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Chatbot" description="Choose how your chatbot talks, then try it out." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Chatbot settings" description="Visitors see these on your website." />
          <CardBody>
            <ChatbotSettingsForm value={settings} onChange={setSettings} onSubmit={save} saving={saving} />
          </CardBody>
        </Card>
        <ChatPanel
          chat={chat}
          title={settings.bot_title || "Your chatbot"}
          description={dirty ? "Save your changes to test new instructions." : "Answers use your saved settings and knowledge."}
          greeting={settings.greeting}
          suggestions={prompts}
          placeholder="Ask what a visitor would ask"
          className="lg:sticky lg:top-6"
        />
      </div>
    </>
  );
}
