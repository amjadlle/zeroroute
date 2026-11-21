"use client";

import { Activity, Database, Gauge, Inbox, Plus, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Meter } from "@/components/ui/Meter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import { StatusDot, type Tone } from "@/components/ui/StatusDot";

// Stand-in until the Button component (#3) lands; the preview must not depend on a sibling PR.
function DemoButton({ children, primary }: { children: ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex h-control-sm items-center gap-1.5 rounded-control px-2.5 text-body font-medium focus-visible:outline-2 focus-visible:outline-focus-ring ${
        primary ? "bg-accent text-accent-fg hover:bg-accent-hover" : "border border-border-strong text-text hover:bg-surface-raised"
      }`}
    >
      {children}
    </button>
  );
}

const TONES: Tone[] = ["neutral", "accent", "success", "warning", "danger", "info"];

const METERS = [
  { label: "Questions used", value: 0, max: 5000, tone: "accent" },
  { label: "Storage used", value: 640, max: 1000, tone: "accent" },
  { label: "Monthly quota", value: 9000, max: 10000, tone: "warning" },
] as const;

function Label({ children }: { children: ReactNode }) {
  return <h3 className="text-meta font-medium uppercase tracking-wide text-text-subtle">{children}</h3>;
}

export default function SurfacesSection() {
  return (
    <div className="space-y-8 font-ui">
      <div className="space-y-3">
        <Label>Section header and KPI row</Label>
        <SectionHeader
          icon={Activity}
          title="Gateway health"
          description="Requests, success rate and latency over the last 7 days."
          actions={<DemoButton>Export</DemoButton>}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Zap} label="Requests" value="48,210" delta="+6%" trend={[38, 41, 40, 44, 43, 46, 48]} />
          <StatTile label="Success rate" value="99.2%" delta="+0.3 pts" trend={[97, 98, 98, 99, 99, 99, 99]} />
          <StatTile label="Median latency" value="612 ms" delta="−48 ms" hint="Lower is better" trend={[740, 700, 690, 660, 650, 630, 612]} />
          <StatTile label="Errors" value="0.8%" delta="+0.2 pts" deltaTone="negative" trend={[0.5, 0.6, 0.6, 0.7, 0.6, 0.7, 0.8]} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Card with header, actions and footer</Label>
        <Card className="max-w-2xl">
          <CardHeader
            as="h3"
            title="Usage this month"
            description="Resets on 1 December"
            actions={
              <>
                <Badge tone="success" pulse>Live</Badge>
                <DemoButton>Details</DemoButton>
              </>
            }
          />
          <CardBody className="space-y-4">
            {METERS.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex justify-between text-body">
                  <span>{m.label}</span>
                  <span className="tabular-nums text-text-muted">
                    {m.value.toLocaleString("en")} of {m.max.toLocaleString("en")} ({Math.round((m.value / m.max) * 100)}%)
                  </span>
                </div>
                <Meter label={m.label} value={m.value} max={m.max} tone={m.tone} />
              </div>
            ))}
          </CardBody>
          <CardFooter>
            <DemoButton>Cancel</DemoButton>
            <DemoButton primary>Upgrade plan</DemoButton>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-3">
        <Label>Badges and status dots</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => <Badge key={t} tone={t}>{t}</Badge>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => <Badge key={t} tone={t} dot>{t} with dot</Badge>)}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-body">
          {TONES.map((t) => (
            <span key={t} className="inline-flex items-center gap-2">
              <StatusDot tone={t} pulse={t === "success"} label={t} />
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-2xl space-y-3">
        <Label>Alerts</Label>
        <Alert tone="info" title="New models available">Two providers added models since your last visit.</Alert>
        <Alert tone="success" title="Settings saved" />
        <Alert tone="warning" title="You have used 90% of this month's questions">Upgrade to keep answering visitors.</Alert>
        <Alert tone="danger" title="Couldn't save your changes">The server did not respond. Your edits are kept; try again.</Alert>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3">
          <Label>Empty state</Label>
          <Card>
            <EmptyState
              icon={Inbox}
              title="No documents yet"
              description="Add a file, a website or pasted text to teach your chatbot."
              action={<DemoButton primary><Plus aria-hidden className="size-4" />Add knowledge</DemoButton>}
            />
          </Card>
        </div>
        <div className="space-y-3">
          <Label>Skeletons</Label>
          <Card aria-busy="true" className="space-y-3 p-4.5">
            <span className="sr-only">Loading documents</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Section header variants</Label>
        <SectionHeader icon={Database} title="Knowledge" description="What your chatbot knows." as="h3" />
        <SectionHeader icon={Gauge} title="Limits" as="h3" actions={<Badge tone="warning">Near limit</Badge>} />
      </div>
    </div>
  );
}
