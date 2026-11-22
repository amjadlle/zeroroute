"use client";

import { useState } from "react";
import { Bot, Code2 } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { DomainsCard } from "@/components/home/DomainsCard";
import { InsightTiles, NeedsAttention, NextStep, useInsights } from "@/components/home/Insights";
import { KeyCard } from "@/components/home/KeyCard";
import { PlanCard } from "@/components/home/PlanCard";
import { RecentQuestions } from "@/components/home/RecentQuestions";
import { SetupChecklist, setupSteps } from "@/components/home/SetupChecklist";
import { UsageCard } from "@/components/home/UsageCard";
import { apiFetch } from "@/lib/client/api";
import { PLAN_LABELS, PLAN_LIMITS } from "@/lib/constants";
import { failMsg, useCustomer } from "./CustomerConsole";

const SUPPORT_EMAIL = "mapkisolutions@gmail.com";

export default function HomePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { profile, setProfile, monthlyLimit, isPro, docs } = useCustomer();
  const [rotatingKey, setRotatingKey] = useState(false);

  const steps = setupSteps(profile, docs.length);
  const left = steps.filter((s) => !s.done).length;
  const used = profile.monthly_requests || 0;
  const live = left === 0;
  const insights = useInsights(live);

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
      if (!data.key) throw new Error("The new key didn't come back. Reload the page to see it.");
      setProfile({ ...profile, key: data.key });
      toast("Your new API key is ready.", { tone: "success" });
    } catch (e) {
      toast(`Couldn't create a new API key: ${failMsg(e)}`, { tone: "danger" });
    } finally {
      setRotatingKey(false);
    }
  };

  // DomainsCard shows the error itself when this throws.
  const saveDomains = async (domains: string[]) => {
    const data = await apiFetch<{ allowedDomains?: string[] }>("/api/customer/domains", { method: "POST", body: { domains } });
    setProfile({ ...profile, allowed_domains: data.allowedDomains ?? domains });
  };

  const copyFailed = () => toast("Couldn't copy. Select the text and copy it by hand.", { tone: "danger" });

  return (
    <>
      {!live ? (
        <PageHeader
          title="Welcome to ZeroRoute"
          description={`${left} ${left === 1 ? "step" : "steps"} left before your chatbot is live.`}
        />
      ) : (
        <PageHeader
          title="Home"
          description={`${isPro ? PLAN_LABELS.pro : PLAN_LABELS.free} plan · ${used.toLocaleString()} requests this month`}
          actions={
            <>
              <Button href="/app/install" variant="secondary" leftIcon={<Code2 aria-hidden className="size-4" />}>Get snippet</Button>
              <Button href="/app/chatbot" leftIcon={<Bot aria-hidden className="size-4" />}>Test chatbot</Button>
            </>
          }
        />
      )}

      {live && (
        <div className="mb-6 grid gap-6">
          {insights.data && <NextStep topics={insights.data.topics} />}
          <InsightTiles {...insights} used={used} limit={monthlyLimit} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-6">
          {live ? <RecentQuestions /> : <SetupChecklist steps={steps} />}
          {live && insights.data && <NeedsAttention data={insights.data} used={used} limit={monthlyLimit} />}
          <DomainsCard domains={profile.allowed_domains || []} isPro={isPro} onSave={saveDomains} />
        </div>
        <aside className="grid content-start gap-6" aria-label="Plan and keys">
          <UsageCard used={used} limit={monthlyLimit} />
          <PlanCard
            isPro={isPro}
            status={profile.status}
            hadPro={monthlyLimit >= PLAN_LIMITS.pro.monthlyRequests}
            daysRemaining={profile.days_remaining || 0}
          />
          <KeyCard apiKey={profile.key} botId={profile.bot_id} onRotateKey={rotateKey} rotating={rotatingKey} onCopyError={copyFailed} />
        </aside>
      </div>

      <p className="mt-6 text-meta text-text-muted">
        Need help setting up?{" "}
        <Button href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Help setting up my ZeroRoute chatbot")}`} variant="link" className="text-meta">
          Email us
        </Button>{" "}
        and we&apos;ll help for free.
      </p>
    </>
  );
}
