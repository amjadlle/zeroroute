"use client";

import { Check, ExternalLink, Mail } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/client/api";
import { PLAN_LABELS, PLAN_LIMITS, SUBSCRIPTION_STATUS_LABELS, UNLIMITED_MONTHLY_REQUESTS, type SubscriptionStatus } from "@/lib/constants";

const SUPPORT_EMAIL = "mapkisolutions@gmail.com";

type PlanDetailsProps = {
  email: string;
  name: string;
  status: string;
  monthlyLimit: number;
  /** Paid through this time (ms), when known. */
  subscriptionExpires?: number;
  isPro: boolean;
};

const mailto = (subject: string, email: string) =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Account email: ${email}\n\n`)}`;

function Includes({ plan, unlimited }: { plan: keyof typeof PLAN_LIMITS; unlimited?: boolean }) {
  const { monthlyRequests, allowedDomains } = PLAN_LIMITS[plan];
  return (
    <ul className="grid gap-1.5 text-body text-text-muted">
      {[
        unlimited ? "No monthly request limit" : `${monthlyRequests.toLocaleString()} requests a month`,
        `${allowedDomains} allowed ${allowedDomains === 1 ? "domain" : "domains"}`,
      ].map((line) => (
        <li key={line} className="flex items-center gap-2">
          <Check aria-hidden className="size-4 text-success-fg" />
          {line}
        </li>
      ))}
    </ul>
  );
}

/**
 * Current plan with its actions. Upgrading only opens checkout: the plan changes when the
 * payment webhook confirms it, never from this page. There is no cancel or invoice API yet,
 * so those go to support by email.
 */
export function PlanDetails({ email, name, status, monthlyLimit, subscriptionExpires, isPro }: PlanDetailsProps) {
  const toast = useToast();
  const [opening, setOpening] = useState(false);
  // Paused and canceled customers keep the Pro limit but are not paid (see isPaidPlan).
  const hadPro = monthlyLimit >= PLAN_LIMITS.pro.monthlyRequests && status !== "active";
  const showsPro = isPro || hadPro;
  const paused = hadPro && status === "paused";
  const statusLabel = SUBSCRIPTION_STATUS_LABELS[status as SubscriptionStatus];

  const upgrade = async () => {
    setOpening(true);
    try {
      // The email lets the webhook match the payment to this account.
      const { checkout_url } = await apiFetch<{ checkout_url?: string }>("/api/checkout", {
        method: "POST",
        body: { email, name },
      });
      if (!checkout_url || new URL(checkout_url).protocol !== "https:") throw new Error("No checkout link came back.");
      window.location.assign(checkout_url);
    } catch (e) {
      toast(`Couldn't open checkout: ${e instanceof Error ? e.message : String(e)}`, { tone: "danger" });
      setOpening(false);
    }
  };

  const upgradeButton = (
    <Button onClick={upgrade} loading={opening} rightIcon={<ExternalLink aria-hidden className="size-4" />}>
      {status === "canceled" && hadPro ? "Restart Pro" : "Upgrade to Pro"}
    </Button>
  );

  return (
    <Card>
      <CardHeader
        title="Your plan"
        description={email}
        actions={showsPro && statusLabel && (
          <Badge tone={status === "active" ? "success" : status === "paused" ? "warning" : "neutral"} dot>
            {statusLabel}
          </Badge>
        )}
      />
      <CardBody className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-heading font-semibold">{showsPro ? PLAN_LABELS.pro : PLAN_LABELS.free}</p>
          <p className="text-body text-text-muted">
            <span className="font-semibold text-text tabular-nums">${PLAN_LIMITS[showsPro ? "pro" : "free"].priceUsd}</span> / month
          </p>
        </div>
        <Includes plan={showsPro ? "pro" : "free"} unlimited={monthlyLimit >= UNLIMITED_MONTHLY_REQUESTS} />
        {isPro && subscriptionExpires ? (
          <p className="text-meta text-text-muted">Paid through {new Date(subscriptionExpires).toLocaleDateString(undefined, { dateStyle: "long" })}.</p>
        ) : null}
        {paused && (
          <Alert tone="warning" title="Your last payment didn't go through">
            Email us and we&apos;ll help you sort it out.
          </Alert>
        )}
        {status === "canceled" && hadPro && (
          <p className="text-body text-text-muted">Your Pro plan is canceled. You can restart it at any time.</p>
        )}
        {!isPro && !hadPro && (
          <div className="grid gap-2 rounded-card border border-border bg-surface-sunken p-3.5">
            <p className="text-body font-semibold">
              Pro: ${PLAN_LIMITS.pro.priceUsd} / month
            </p>
            <Includes plan="pro" />
          </div>
        )}
      </CardBody>
      <CardFooter className="flex-wrap justify-start">
        {!isPro && !paused && upgradeButton}
        <Button
          variant={paused ? "primary" : "secondary"}
          href={mailto(isPro ? "Change or cancel my ZeroRoute plan" : paused ? "Fix my ZeroRoute payment" : "ZeroRoute billing question", email)}
          leftIcon={<Mail aria-hidden className="size-4" />}
        >
          {isPro ? "Change or cancel plan" : paused ? "Fix payment" : "Contact billing"}
        </Button>
        <p className="w-full text-meta text-text-subtle">Need an invoice? Email {SUPPORT_EMAIL} and we&apos;ll send it.</p>
      </CardFooter>
    </Card>
  );
}
