import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PLAN_LABELS, PLAN_LIMITS, SUBSCRIPTION_STATUS_LABELS, type SubscriptionStatus } from "@/lib/constants";

type PlanCardProps = {
  /** isPaidPlan(): Pro with working payments. */
  isPro: boolean;
  /** Has the Pro quota, so has bought Pro at some point (paused and canceled keep it). */
  hadPro: boolean;
  status: string;
  daysRemaining: number;
};

const STATUS_TONE = { active: "success", paused: "warning", canceled: "neutral" } as const;
const { free, pro } = PLAN_LIMITS;

function summary({ isPro, hadPro, status, daysRemaining }: PlanCardProps): string {
  if (isPro) {
    const days = daysRemaining > 0 ? ` ${daysRemaining} days left in this billing period.` : "";
    return `${pro.monthlyRequests.toLocaleString()} requests a month and up to ${pro.allowedDomains} allowed domains.${days}`;
  }
  if (hadPro && status === "paused") return "Your last payment didn't go through. Update your payment details to keep Pro.";
  if (hadPro && status === "canceled") return "Your Pro plan is canceled. You can start it again at any time.";
  return `${free.monthlyRequests.toLocaleString()} requests a month and ${free.allowedDomains} allowed domain. Pro gives you ${pro.monthlyRequests.toLocaleString()} requests and ${pro.allowedDomains} domains for $${pro.priceUsd} a month.`;
}

export function PlanCard(props: PlanCardProps) {
  const { hadPro, status } = props;
  const known = hadPro && status in SUBSCRIPTION_STATUS_LABELS ? (status as SubscriptionStatus) : null;

  return (
    <Card>
      <CardHeader
        as="h3"
        title={`${hadPro ? PLAN_LABELS.pro : PLAN_LABELS.free} plan`}
        actions={known ? <Badge tone={STATUS_TONE[known]} dot>{SUBSCRIPTION_STATUS_LABELS[known]}</Badge> : undefined}
      />
      <CardBody className="grid gap-3">
        <p className="text-body text-text-muted">{summary(props)}</p>
        <Button href="/app/billing" variant="secondary" size="sm" className="justify-self-start">
          {hadPro ? "Manage billing" : "Compare plans"}
        </Button>
      </CardBody>
    </Card>
  );
}
