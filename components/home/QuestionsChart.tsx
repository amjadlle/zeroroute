import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { Insights } from "./Insights";

type QuestionsChartProps = { data: Insights | null; error: string | null; reload: () => void };

// Insights dates are already local days (YYYY-MM-DD); format them as-is, not shifted by the browser's zone.
const fmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
const dayLabel = (date: string) => fmt.format(new Date(`${date}T00:00:00Z`));

/** Top of the y axis: the smallest 1, 2, 4, 6, 8 or 10 × 10^k at or above `max` (at least 2), so the middle line is a whole number. */
export function axisMax(max: number) {
  if (max <= 2) return 2;
  const p = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 4, 6, 8, 10].map((m) => m * p).find((v) => v >= max) ?? 10 * p;
}

/** Bar chart of questions per day over the insights window (14 days); the last 7 days are highlighted. */
export function QuestionsChart({ data, error, reload }: QuestionsChartProps) {
  let body;
  if (error) {
    body = (
      <Alert tone="danger" title="Couldn't load questions per day">
        <p>{error}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={reload}>Try again</Button>
      </Alert>
    );
  } else if (!data) {
    body = (
      <div aria-busy="true">
        <span className="sr-only">Loading questions per day</span>
        <Skeleton className="h-52" />
      </div>
    );
  } else {
    const { days } = data;
    const total = days.reduce((s, d) => s + d.total, 0);
    const busiest = days.reduce((a, b) => (b.total > a.total ? b : a), days[0]);
    const top = axisMax(busiest?.total ?? 0);
    const summary = total === 0 || !busiest
      ? `No questions in the last ${days.length} days.`
      : `Questions per day for the last ${days.length} days: ${total.toLocaleString()} in total. The busiest day was ${dayLabel(busiest.date)} with ${busiest.total.toLocaleString()}.`;

    body = (
      <div role="img" aria-label={summary} className="flex gap-2">
        <div aria-hidden className="relative h-44 w-8 shrink-0 text-right text-meta text-text-subtle tabular-nums">
          {[top, top / 2, 0].map((t, i) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${i * 50}%` }}>{t.toLocaleString()}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative flex h-44 items-end gap-1 border-b border-border">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 border-y border-dashed border-border" />
            {days.map((d, i) => (
              <div key={d.date} className="relative flex h-full flex-1 items-end justify-center" title={`${dayLabel(d.date)}: ${d.total.toLocaleString()}`}>
                <div
                  className={cn("w-full max-w-6 rounded-t-sm", i < days.length - 7 ? "bg-accent/35" : "bg-accent", d.total > 0 && "min-h-0.5")}
                  style={{ height: `${(d.total / top) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div aria-hidden className="mt-1.5 flex h-4 gap-1 text-meta text-text-subtle">
            {days.map((d, i) => {
              // Counting back from today, so the latest day is always labelled: every 2nd day, every 4th on phones.
              const back = days.length - 1 - i;
              return (
                <span key={d.date} className="relative flex-1">
                  {back % 2 === 0 && (
                    <span
                      className={cn(
                        "absolute whitespace-nowrap",
                        back === 0 ? "right-0" : "left-1/2 -translate-x-1/2",
                        back % 4 !== 0 && "max-sm:hidden",
                      )}
                    >
                      {dayLabel(d.date)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader title="Questions per day" description="Last 14 days. The last 7 days are darker." />
      <CardBody>{body}</CardBody>
    </Card>
  );
}
