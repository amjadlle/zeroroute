"use client";

import confetti from "canvas-confetti";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/shell/BrandMark";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";
import { apiFetch } from "@/lib/client/api";
import { isPaidPlan, PLAN_LIMITS } from "@/lib/constants";

const SUPPORT_EMAIL = "mapkisolutions@gmail.com";
const SETUP_CALL_URL = "https://cal.com/mapki/zeroroute-setup";
const CHECKOUT_PARAMS = ["session_id", "id", "subscription_id", "payment_id"];
// Waits between checks while the payment webhook creates the account (~30s in total).
export const PENDING_BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];

type CheckoutStatus = { success?: boolean; paid?: boolean; pending?: boolean; claimed?: boolean };
type Profile = { status?: string; monthly_limit?: number };

export type WelcomeState =
  | { kind: "loading" }
  | { kind: "paid"; signedIn: boolean } // checkout confirmed as paid
  | { kind: "member"; pro: boolean } // signed in, no checkout to confirm
  | { kind: "processing" } // paid, account still being created
  | { kind: "failed" }
  | { kind: "none" }; // no checkout and not signed in

const quiet = { onUnauthorized: () => {} };
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });

async function loadProfile(signal: AbortSignal): Promise<Profile | null> {
  try {
    return (await apiFetch<{ customer?: Profile }>("/api/customer/profile", { ...quiet, signal })).customer ?? null;
  } catch {
    return null;
  }
}

async function resolveState(query: string, signal: AbortSignal): Promise<WelcomeState> {
  const params = new URLSearchParams(query);
  if (!CHECKOUT_PARAMS.some((p) => params.get(p))) {
    const profile = await loadProfile(signal);
    return profile ? { kind: "member", pro: isPaidPlan(profile) } : { kind: "none" };
  }

  for (let attempt = 0; ; attempt++) {
    let res: CheckoutStatus;
    try {
      res = await apiFetch<CheckoutStatus>(`/api/checkout/session?${query}`, { ...quiet, signal });
    } catch {
      return { kind: "failed" };
    }
    // First successful check sets the session cookie.
    if (res.success) return { kind: "paid", signedIn: true };
    // Already claimed (e.g. page refresh): paid, but no new session; use the cookie if it is still there.
    if (res.claimed) return { kind: "paid", signedIn: (await loadProfile(signal)) !== null };
    if (!res.pending) return { kind: "failed" };
    if (attempt >= PENDING_BACKOFF_MS.length) return { kind: "processing" };
    await sleep(PENDING_BACKOFF_MS[attempt], signal);
    if (signal.aborted) return { kind: "loading" };
  }
}

export function Welcome() {
  const query = useSearchParams().toString();
  const [state, setState] = useState<WelcomeState>({ kind: "loading" });
  const [run, setRun] = useState(0);
  const retry = useCallback(() => { setState({ kind: "loading" }); setRun((n) => n + 1); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    resolveState(query, ctrl.signal).then((s) => { if (!ctrl.signal.aborted) setState(s); });
    return () => ctrl.abort();
  }, [query, run]);

  useEffect(() => {
    if (state.kind === "paid") confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
  }, [state.kind]);

  return (
    <div className="min-h-dvh bg-bg font-ui text-text">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link href="/" aria-label="ZeroRoute home" className="rounded-control focus-visible:outline-2 focus-visible:outline-focus-ring">
            <BrandMark size="sm" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <WelcomeView state={state} onRetry={retry} />
      </main>
    </div>
  );
}

const PLAN_FACTS = {
  free: `${PLAN_LIMITS.free.monthlyRequests.toLocaleString("en")} requests a month and ${PLAN_LIMITS.free.allowedDomains} allowed domain`,
  pro: `${PLAN_LIMITS.pro.monthlyRequests.toLocaleString("en")} requests a month and ${PLAN_LIMITS.pro.allowedDomains} allowed domains`,
};

function Intro({ badge, title, children }: { badge?: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      {badge}
      <h1 className="text-heading font-semibold sm:text-display">{title}</h1>
      <p className="text-body-lg text-text-muted">{children}</p>
    </div>
  );
}

function NextSteps({ upgrade }: { upgrade?: boolean }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <h2 className="text-title font-semibold">Next steps</h2>
        <p className="text-body text-text-muted">
          Set up your chatbot: give it a name, add knowledge about your business, and get the embed snippet for your website.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button href="/onboarding" size="lg" rightIcon={<ArrowRight aria-hidden className="size-4" />}>Set up your chatbot</Button>
          <Button href="/app" variant="secondary" size="lg">Go to the console</Button>
          {upgrade && <Button href="/app/billing" variant="ghost" size="lg">Upgrade to Pro</Button>}
        </div>
      </CardBody>
    </Card>
  );
}

function Help({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <h2 className="text-title font-semibold">{title}</h2>
        <p className="text-body text-text-muted">{children}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button href={`mailto:${SUPPORT_EMAIL}`} variant="secondary" leftIcon={<Mail aria-hidden className="size-4" />}>Email us</Button>
          <Button href={SETUP_CALL_URL} target="_blank" rel="noopener noreferrer" variant="secondary" leftIcon={<Calendar aria-hidden className="size-4" />}>
            Book a free setup call
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function WelcomeView({ state, onRetry }: { state: WelcomeState; onRetry: () => void }) {
  switch (state.kind) {
    case "loading":
      return <PageLoader label="Checking your account" />;
    case "paid":
      return (
        <>
          <Intro badge={<Badge tone="success" dot>Payment confirmed</Badge>} title="Welcome to ZeroRoute Pro">
            Your Pro plan is active: {PLAN_FACTS.pro}. We have also emailed you your account details.
          </Intro>
          {state.signedIn ? (
            <NextSteps />
          ) : (
            <Alert tone="info" title="Log in to continue">
              <p>This payment was already confirmed on another visit. Log in with the details we emailed you.</p>
              <Button href="/login" size="sm" className="mt-2">Log in</Button>
            </Alert>
          )}
          <Help title="Want a hand?">We will set up and test your chatbot with you for free.</Help>
        </>
      );
    case "member":
      return (
        <>
          <Intro badge={<Badge tone={state.pro ? "accent" : "neutral"}>{state.pro ? "Pro plan" : "Free plan"}</Badge>} title="Welcome to ZeroRoute">
            You are on the {state.pro ? `Pro plan: ${PLAN_FACTS.pro}` : `Free plan: ${PLAN_FACTS.free}`}.
          </Intro>
          <NextSteps upgrade={!state.pro} />
        </>
      );
    case "processing":
      return (
        <>
          <Intro badge={<Badge tone="info" pulse>Processing</Badge>} title="We are setting up your account">
            Your payment went through. Creating your account is taking a little longer than usual. This page does not
            need to stay open: we will email you as soon as your account is ready.
          </Intro>
          <div><Button onClick={onRetry} variant="secondary">Check again</Button></div>
          <Help title="Still waiting after a few minutes?">Email us and we will sort it out.</Help>
        </>
      );
    case "failed":
      return (
        <>
          <Intro title="We could not confirm your payment">
            The payment may not have gone through, or we could not reach the payment provider. If you were charged, email
            us and we will fix it.
          </Intro>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={onRetry}>Try again</Button>
            <Button href="/#pricing" variant="secondary">View plans</Button>
          </div>
          <Help title="Need help?">Tell us the email you paid with and we will look it up.</Help>
        </>
      );
    case "none":
      return (
        <>
          <Intro title="Nothing to show here yet">
            This page opens after you pay for a plan. If you already have an account, log in to get to your console.
          </Intro>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button href="/login">Log in</Button>
            <Button href="/#pricing" variant="secondary">View plans</Button>
          </div>
        </>
      );
  }
}
