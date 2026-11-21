"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { BarChart3, BookOpen, Bot, Code2, CreditCard, House } from "lucide-react";
import { ConsoleShell, type NavGroup } from "@/components/shell/ConsoleShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import type { KnowledgeSource } from "@/components/shared/knowledge/KnowledgeList";
import { apiFetch, ApiError } from "@/lib/client/api";
import { PLAN_LABELS, PLAN_LIMITS, isPaidPlan } from "@/lib/constants";

export interface CustomerProfile {
  id: string;
  key: string;
  email: string;
  name: string;
  company?: string;
  website?: string;
  bot_title: string;
  bot_role: string;
  tone: string;
  greeting: string;
  prompts: string[];
  persona: string;
  /** #rrggbb or "" for the widget default. */
  brand_color?: string;
  logo_url?: string;
  status: string;
  subscription_expires?: number;
  days_remaining: number;
  monthly_requests: number;
  monthly_limit: number;
  bot_id: string;
  allowed_domains?: string[];
  knowledge_docs_count: number;
  is_admin?: boolean;
}

type CustomerContextValue = {
  profile: CustomerProfile;
  /** The plan's monthly request limit (profile value, else the Free plan's). */
  monthlyLimit: number;
  isPro: boolean;
  docs: KnowledgeSource[];
  /** Set when the last knowledge load failed. */
  docsError: string | null;
  setProfile: (p: CustomerProfile) => void;
  refreshProfile: () => Promise<void>;
  refreshDocs: () => Promise<void>;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

/** Profile and knowledge for the signed-in customer. Only usable inside /app pages. */
export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer() must be used inside the /app layout.");
  return ctx;
}

const icon = "size-4";

export const failMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function CustomerConsole({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [docs, setDocs] = useState<KnowledgeSource[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await apiFetch<{ customer?: CustomerProfile }>("/api/customer/profile");
      if (!data.customer) throw new Error("Your account details came back empty.");
      setProfile(data.customer);
      setError(null);
    } catch (e) {
      // 401: apiFetch clears the cookie and goes to /login.
      if (!(e instanceof ApiError && e.status === 401)) setError(failMsg(e));
    }
  }, []);

  const refreshDocs = useCallback(async () => {
    try {
      const data = await apiFetch<{ documents?: KnowledgeSource[] }>("/api/knowledge");
      setDocs(data.documents ?? []);
      setDocsError(null);
    } catch (e) {
      // Only the Knowledge page shows this; profile errors are the ones that block.
      setDocsError(failMsg(e));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshProfile(), refreshDocs()]);
    setLoading(false);
  }, [refreshProfile, refreshDocs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load();
  }, [load]);

  const isPro = isPaidPlan(profile);

  const nav: NavGroup[] = [
    {
      label: "Your chatbot",
      items: [
        { href: "/app", label: "Home", icon: <House className={icon} /> },
        { href: "/app/chatbot", label: "Chatbot", icon: <Bot className={icon} /> },
        { href: "/app/knowledge", label: "Knowledge", icon: <BookOpen className={icon} />, count: profile ? docs.length : undefined },
        { href: "/app/install", label: "Install", icon: <Code2 className={icon} /> },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/app/usage", label: "Usage", icon: <BarChart3 className={icon} /> },
        { href: "/app/billing", label: "Billing", icon: <CreditCard className={icon} /> },
      ],
    },
  ];

  let body: ReactNode;
  if (profile) {
    const value: CustomerContextValue = {
      profile,
      monthlyLimit: profile.monthly_limit || PLAN_LIMITS.free.monthlyRequests,
      isPro,
      docs,
      docsError,
      setProfile,
      refreshProfile,
      refreshDocs,
    };
    body = <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
  } else if (loading) {
    body = <PageLoader label="Loading your account" />;
  } else {
    body = (
      <Alert tone="danger" title="We couldn't load your account">
        <p className="mt-1">{error ?? "Something went wrong."} Check your connection and try again.</p>
        <Button size="sm" variant="secondary" className="mt-3" onClick={load}>Try again</Button>
      </Alert>
    );
  }

  return (
    <ConsoleShell
      consoleLabel="User console"
      nav={nav}
      account={{
        name: profile?.name || profile?.company || "Your account",
        email: profile?.email ?? "",
        plan: profile ? `${isPro ? PLAN_LABELS.pro : PLAN_LABELS.free} plan` : "",
      }}
      consoleSwitch={Boolean(profile?.is_admin)}
    >
      {profile && error && (
        <Alert tone="danger" title="We couldn't refresh your account" className="mb-4">
          {error}
        </Alert>
      )}
      {body}
    </ConsoleShell>
  );
}
