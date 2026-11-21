"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { apiFetch } from "@/lib/client/api";
import { failMsg, useCustomer } from "./CustomerConsole";

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { profile, setProfile, monthlyLimit } = useCustomer();
  const [rotatingKey, setRotatingKey] = useState(false);

  const rotateKey = async () => {
    const ok = await confirm({
      title: "Get a new API key?",
      body: "Your current key stops working straight away. Update it everywhere you use it.",
      confirmLabel: "Get new key",
      tone: "danger",
    });
    if (!ok) return;
    setRotatingKey(true);
    try {
      const data = await apiFetch<{ key?: string }>("/api/customer/key/regenerate", { method: "POST" });
      if (data.key) setProfile({ ...profile, key: data.key });
      toast("Your new API key is ready.", { tone: "success" });
    } catch (e) {
      toast(`Couldn't create a new API key: ${failMsg(e)}`, { tone: "danger" });
    } finally {
      setRotatingKey(false);
    }
  };

  // OverviewTab shows its own inline message when this throws.
  const updateDomains = async (domains: string[]) => {
    const data = await apiFetch<{ allowedDomains?: string[] }>("/api/customer/domains", { method: "POST", body: { domains } });
    if (data.allowedDomains) setProfile({ ...profile, allowed_domains: data.allowedDomains });
  };

  return (
    <>
      <PageHeader title="Home" description="Your API key, Bot ID, allowed domains and usage at a glance." />
      <OverviewTab
        apiKey={profile.key}
        botId={profile.bot_id}
        monthlyRequests={profile.monthly_requests || 0}
        monthlyLimit={monthlyLimit}
        daysRemaining={profile.days_remaining || 0}
        allowedDomains={profile.allowed_domains || []}
        onUpdateDomains={updateDomains}
        onOpenBilling={() => router.push("/app/billing")}
        onRotateKey={rotateKey}
        rotatingKey={rotatingKey}
      />
    </>
  );
}
