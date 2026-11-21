import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";

type UsageCardProps = {
  used: number;
  limit: number;
};

/** Requests used this month against the plan limit. Shown on Billing and Usage. */
export function UsageCard({ used, limit }: UsageCardProps) {
  const pct = limit > 0 ? used / limit : 0;
  const tone = pct >= 1 ? "danger" : pct >= 0.8 ? "warning" : "accent";
  const text = `${used.toLocaleString()} of ${limit.toLocaleString()}`;
  return (
    <Card>
      <CardHeader title="Usage this month" description="Resets at the start of each monthly period." />
      <CardBody className="grid gap-2">
        <p className="text-body">
          <span className="text-heading font-semibold tabular-nums">{used.toLocaleString()}</span>
          <span className="text-text-muted"> of {limit.toLocaleString()} requests</span>
        </p>
        <Meter value={used} max={limit} tone={tone} label="Requests used this month" valueText={text} />
        {pct >= 1 ? (
          <p className="text-meta text-danger-fg">You have reached your monthly limit. Your chatbot stops answering until it resets.</p>
        ) : pct >= 0.8 ? (
          <p className="text-meta text-warning-fg">You have used most of this month&apos;s requests.</p>
        ) : null}
      </CardBody>
    </Card>
  );
}
