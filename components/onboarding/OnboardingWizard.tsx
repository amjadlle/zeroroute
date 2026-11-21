"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/shell/BrandMark";
import { ThemeScript, ThemeToggle } from "@/components/shell/ThemeToggle";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";
import { UiProviders } from "@/components/ui/UiProviders";
import type { CustomerProfile } from "@/app/app/CustomerConsole";
import type { KnowledgeSource } from "@/components/shared/knowledge/KnowledgeList";
import { apiFetch, ApiError } from "@/lib/client/api";
import { AccountStep, type AccountValues } from "./AccountStep";
import { ChatbotSettingsForm, type ChatbotSettings } from "@/components/dashboard/ChatbotSettingsForm";
import { FinishStep } from "./FinishStep";
import { KnowledgeStep } from "./KnowledgeStep";
import { Stepper } from "./Stepper";
import { useOnboardingSave } from "./useOnboardingSave";

const STEPS = [
  { label: "Account", title: "Your account", description: "Tell us who the chatbot is for." },
  { label: "Chatbot", title: "Your chatbot", description: "Choose how it greets and talks to visitors." },
  { label: "Knowledge", title: "Knowledge", description: "The chatbot answers questions from what you add here." },
  { label: "Finish", title: "You're all set", description: "Your settings are saved. Here's how to put the chatbot live." },
] as const;

const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong.");

/** Four-step setup. Each step saves before moving on; a failed save keeps the input and shows why. */
export function OnboardingWizard() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<AccountValues>({ company: "", website: "", password: "" });
  const [chatbot, setChatbot] = useState<ChatbotSettings>({ bot_title: "", greeting: "", persona: "", prompts: [], brand_color: "", logo_url: "" });
  const [sources, setSources] = useState<KnowledgeSource[] | undefined>();
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const { save, saving, error, clearError } = useOnboardingSave();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    try {
      // Cookie session only; 401 sends the visitor to log in and come back here.
      const { customer: c } = await apiFetch<{ customer?: CustomerProfile }>("/api/customer/profile");
      if (!c) throw new Error("Your account details came back empty.");
      setProfile(c);
      setAccount({ company: c.company ?? "", website: c.website ?? "", password: "" });
      setChatbot({ bot_title: c.bot_title, greeting: c.greeting, persona: c.persona, prompts: c.prompts ?? [], brand_color: c.brand_color ?? "", logo_url: c.logo_url ?? "" });
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) setLoadError(message(e));
    }
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const data = await apiFetch<{ documents?: KnowledgeSource[] }>("/api/knowledge");
      setSources(data.documents ?? []);
      setSourcesError(null);
    } catch (e) {
      setSourcesError(message(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    loadProfile();
    loadSources();
  }, [loadProfile, loadSources]);

  // Move focus to the new step's heading so keyboard and screen reader users land on it.
  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step]);

  const go = (next: number) => {
    clearError();
    moved.current = true;
    setStep(next);
  };

  const saveAccount = async () => {
    const company = account.company.trim();
    const ok = await save("/api/onboarding/setup", {
      name: company,
      company,
      website: account.website.trim(),
      password: account.password || undefined,
    });
    if (!ok) return;
    setAccount((a) => ({ ...a, company, password: "" }));
    go(1);
  };

  const saveChatbot = async () => {
    const prompts = chatbot.prompts.map((p) => p.trim()).filter(Boolean);
    const ok = await save("/api/customer/persona", { ...chatbot, prompts });
    if (!ok) return;
    setChatbot((c) => ({ ...c, prompts }));
    go(2);
  };

  const back = step > 0 && (
    <Button variant="ghost" leftIcon={<ArrowLeft aria-hidden className="size-4" />} onClick={() => go(step - 1)} disabled={saving}>
      Back
    </Button>
  );

  let body;
  if (!profile) {
    body = loadError ? (
      <Alert tone="danger" title="Couldn't load your account.">
        <p>{loadError}</p>
        <Button variant="link" onClick={loadProfile}>Try again</Button>
      </Alert>
    ) : (
      <PageLoader label="Loading your account" />
    );
  } else {
    const s = STEPS[step];
    body = (
      <>
        <Stepper steps={STEPS.map((x) => x.label)} current={step} />
        <Card>
          <CardBody className="grid gap-5 sm:p-6">
            <div className="grid gap-1">
              <h2 ref={headingRef} tabIndex={-1} className="text-heading font-semibold outline-none">{s.title}</h2>
              <p className="text-text-muted">{s.description}</p>
            </div>
            {error && <Alert tone="danger" title="Couldn't save. Your changes are still here.">{error}</Alert>}
            {step === 0 && <AccountStep value={account} onChange={setAccount} onSubmit={saveAccount} saving={saving} />}
            {step === 1 && <ChatbotSettingsForm value={chatbot} onChange={setChatbot} onSubmit={saveChatbot} saving={saving} submitLabel="Save and continue" actions={back} />}
            {step === 2 && (
              <KnowledgeStep sources={sources} error={sourcesError} onRetry={loadSources} onAdded={loadSources} onContinue={() => go(3)} actions={back} />
            )}
            {step === 3 && <FinishStep apiKey={profile.key} botId={profile.bot_id} actions={back} />}
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <UiProviders>
      <ThemeScript />
      <div className="min-h-dvh bg-bg font-ui text-body text-text">
        <header className="flex h-14 items-center justify-between gap-2 border-b border-border px-4 sm:px-6">
          <Link href="/" className="rounded-control focus-visible:outline-2 focus-visible:outline-focus-ring">
            <BrandMark size="sm" />
          </Link>
          <ThemeToggle />
        </header>
        <main className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-8 sm:px-6">
          <h1 className="text-display font-semibold">Set up your chatbot</h1>
          {body}
        </main>
      </div>
    </UiProviders>
  );
}
