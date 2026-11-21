import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { UNLIMITED_MONTHLY_REQUESTS } from "@/lib/constants";

type UsageCardProps = { used: number; limit: number };

/** Requests this month against the plan limit. Zero shows as an empty bar. */
export function UsageCard({ used, limit }: UsageCardProps) {
  const unlimited = limit >= UNLIMITED_MONTHLY_REQUESTS;
  const pct = limit > 0 ? used / limit : 0;
  const tone = pct >= 1 ? "danger" : pct >= 0.8 ? "warning" : "accent";
  const valueText = `${used.toLocaleString()} of ${limit.toLocaleString()} requests`;

  return (
    <Card>
      <CardHeader as="h3" title="Usage this month" />
      <CardBody className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-title font-semibold tabular-nums">{used.toLocaleString()}</span>
          <span className="text-meta text-text-muted tabular-nums">
            {unlimited ? "No monthly limit" : `of ${limit.toLocaleString()} requests`}
          </span>
        </div>
        {!unlimited && <Meter value={used} max={limit} tone={tone} label="Requests used this month" valueText={valueText} />}
        <p className="text-meta text-text-muted">
          {pct >= 1 && !unlimited
            ? "You've reached your limit. Your chatbot stops answering until the count resets or you upgrade."
            : "Each question to your chatbot or call to the API counts as one request. The count resets every month."}
        </p>
      </CardBody>
    </Card>
  );
}
