"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { appearanceErrors, ChatbotSettingsForm, type ChatbotSettings } from "@/components/dashboard/ChatbotSettingsForm";
import { linkClass } from "@/components/install/SnippetCard";
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
    brand_color: profile.brand_color ?? "",
    logo_url: profile.logo_url ?? "",
  };
  const [settings, setSettings] = useState(saved);
  const [saving, setSaving] = useState(false);
  // Same-origin session cookie: the gateway answers with this customer's saved settings and knowledge.
  const chat = useChatStream();

  const prompts = settings.prompts.map((p) => p.trim()).filter(Boolean);
  const dirty = JSON.stringify({ ...settings, prompts }) !== JSON.stringify(saved);
  // Preview only shows values that would save; the brand colour is user data, so it may style the preview.
  const valid = appearanceErrors(settings);
  const color = settings.brand_color && !valid.brand_color ? settings.brand_color.trim() : undefined;
  const logo = settings.logo_url && !valid.logo_url ? settings.logo_url.trim() : undefined;

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
      <PageHeader title="Chatbot" description="How your chatbot looks and talks. Try it out in the test chat." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(17.5rem,1fr)]">
        <Card>
          <CardHeader title="Settings" description="Visitors see these on your website." />
          <CardBody>
            <ChatbotSettingsForm
              value={settings}
              onChange={setSettings}
              onSubmit={save}
              saving={saving}
              actions={
                dirty && (
                  <Button variant="ghost" onClick={() => setSettings(saved)} disabled={saving}>
                    Discard changes
                  </Button>
                )
              }
            />
            <p className="mt-4 text-meta text-text-muted">
              To choose which websites can show your chatbot, set your{" "}
              <Link href="/app" className={linkClass}>allowed domains</Link> on Home.
            </p>
          </CardBody>
        </Card>
        <ChatPanel
          chat={chat}
          title={
            <span className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- customer's own image host, not in next.config */}
              {logo && <img src={logo} alt="" className="size-6 rounded-control object-contain" />}
              {settings.bot_title || "Your chatbot"}
            </span>
          }
          description={dirty ? "Save your changes to test new instructions." : "Answers use your saved settings and knowledge."}
          greeting={settings.greeting}
          suggestions={prompts}
          placeholder="Ask what a visitor would ask"
          className={color ? "border-t-4 lg:sticky lg:top-6" : "lg:sticky lg:top-6"}
          style={color ? { borderTopColor: color } : undefined}
        />
      </div>
    </>
  );
}
