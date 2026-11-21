"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { PersonaTab } from "@/components/dashboard/PersonaTab";
import { WidgetTab } from "@/components/dashboard/WidgetTab";
import { apiFetch } from "@/lib/client/api";
import { failMsg, useCustomer } from "../CustomerConsole";

export default function ChatbotPage() {
  const toast = useToast();
  const { profile, refreshProfile } = useCustomer();
  const [saving, setSaving] = useState(false);

  const save = async (data: { bot_title: string; bot_role: string; tone: string; greeting: string; persona: string }) => {
    setSaving(true);
    try {
      await apiFetch("/api/customer/persona", { method: "POST", body: data });
      await refreshProfile();
    } catch (e) {
      toast(`Couldn't save your chatbot settings: ${failMsg(e)}`, { tone: "danger" });
      throw e; // PersonaTab skips its success banner
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Chatbot" description="Choose how your chatbot talks, then try it out." />
      <div className="grid gap-6">
        <PersonaTab
          initialBotTitle={profile.bot_title}
          initialBotRole={profile.bot_role}
          initialTone={profile.tone}
          initialGreeting={profile.greeting}
          initialPersona={profile.persona}
          onSave={save}
          saving={saving}
        />
        <WidgetTab
          botTitle={profile.bot_title}
          greeting={profile.greeting}
          botId={profile.bot_id}
          prompts={profile.prompts || []}
          apiKey={profile.key}
        />
      </div>
    </>
  );
}
