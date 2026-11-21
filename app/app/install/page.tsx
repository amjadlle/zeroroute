"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { DocsTab } from "@/components/dashboard/DocsTab";
import { useCustomer } from "../CustomerConsole";

export default function InstallPage() {
  const { profile } = useCustomer();
  return (
    <>
      <PageHeader title="Install" description="Add your chatbot to your website, or call the API from your own code." />
      <DocsTab
        apiKey={profile.key}
        botId={profile.bot_id}
        initialBotTitle={profile.bot_title}
        initialGreeting={profile.greeting}
        initialPrompts={profile.prompts || []}
      />
    </>
  );
}
