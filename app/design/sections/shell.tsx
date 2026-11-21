"use client";

import { useState } from "react";
import { BarChart3, Bot, BookOpen, Code2, CreditCard, FlaskConical, House, LayoutDashboard, Plus, ScrollText, Server, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useToast } from "@/components/ui/Toast";
import { ConsoleShell, type NavGroup } from "@/components/shell/ConsoleShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { BrandMark } from "@/components/shell/BrandMark";

const icon = "size-4";

const APP_NAV: NavGroup[] = [
  {
    label: "Your chatbot",
    items: [
      { href: "/design", label: "Home", icon: <House className={icon} /> },
      { href: "/app/chatbot", label: "Chatbot", icon: <Bot className={icon} /> },
      { href: "/app/knowledge", label: "Knowledge", icon: <BookOpen className={icon} />, count: 12 },
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

const ADMIN_NAV: NavGroup[] = [
  {
    label: "Gateway",
    items: [
      { href: "/design", label: "Overview", icon: <LayoutDashboard className={icon} /> },
      { href: "/admin/providers", label: "Providers", icon: <Server className={icon} />, count: 7 },
      { href: "/admin/customers", label: "Customers", icon: <Users className={icon} />, count: 128 },
      { href: "/admin/knowledge", label: "Knowledge", icon: <BookOpen className={icon} /> },
      { href: "/admin/logs", label: "Request log", icon: <ScrollText className={icon} /> },
      { href: "/admin/playground", label: "Playground", icon: <FlaskConical className={icon} /> },
    ],
  },
];

function DemoPage({ admin }: { admin: boolean }) {
  const toast = useToast();
  return (
    <>
      <PageHeader
        title={admin ? "Overview" : "Home"}
        description={admin ? "Gateway health across all providers." : "Finish setting up your chatbot."}
        actions={<Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => toast("Demo only: nothing was added.", { tone: "info" })}>Add knowledge</Button>}
      />
      <Card className="p-5 text-text-muted">
        Page content goes here. Try <kbd className="font-ui-mono text-text">Ctrl K</kbd>, the theme toggle, or narrow the window below 820px for the menu.
        Nav links to the real /app and /admin routes leave this page.
      </Card>
    </>
  );
}

export default function ShellSection() {
  const [which, setWhich] = useState("app");
  const admin = which === "admin";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          label="Console"
          value={which}
          onValueChange={setWhich}
          options={[{ value: "app", label: "User console" }, { value: "admin", label: "Admin console (admin user)" }]}
        />
        <Badge tone="warning">Demo: contained preview, not mounted on /app or /admin</Badge>
      </div>

      <div className="h-150 overflow-hidden rounded-card border-2 border-dashed border-border-strong">
        <ConsoleShell
          key={which}
          embedded
          consoleLabel={admin ? "Admin console" : "User console"}
          nav={admin ? ADMIN_NAV : APP_NAV}
          account={admin ? { name: "ZeroRoute admin", email: "admin@example.com", plan: "Admin" } : { name: "Brightpath Tutors", email: "hello@brightpath.example", plan: "Pro plan" }}
          consoleSwitch={admin}
          paletteActions={[{ label: `Demo: switch to the ${admin ? "user" : "admin"} console`, icon: <Users className={icon} />, run: () => setWhich(admin ? "app" : "admin") }]}
        >
          <DemoPage admin={admin} />
        </ConsoleShell>
      </div>

      <div className="grid gap-3">
        <h3 className="text-meta text-text-subtle">BrandMark (sm, md, lg with tagline)</h3>
        <div className="flex flex-wrap items-center gap-8">
          <BrandMark size="sm" />
          <BrandMark />
          <BrandMark size="lg" tagline="Admin console" />
        </div>
      </div>
    </div>
  );
}
