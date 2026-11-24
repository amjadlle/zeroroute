"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Bot, BookOpen, Code2, CreditCard, FlaskConical, House, LayoutDashboard, ScrollText, Server, Users } from "lucide-react";
import { ConsoleShell, type NavGroup, type ShellAccount } from "@/components/shell/ConsoleShell";

const icon = "size-4";

const ADMIN_NAV: NavGroup[] = [
  {
    label: "Gateway",
    items: [
      { href: "/admin", label: "Overview", icon: <LayoutDashboard className={icon} /> },
      { href: "/admin/providers", label: "Providers", icon: <Server className={icon} /> },
      { href: "/admin/customers", label: "Customers", icon: <Users className={icon} /> },
      { href: "/admin/knowledge", label: "Knowledge", icon: <BookOpen className={icon} /> },
      { href: "/admin/logs", label: "Request log", icon: <ScrollText className={icon} /> },
      { href: "/admin/playground", label: "Playground", icon: <FlaskConical className={icon} /> },
    ],
  },
];

// Customer console pages (issue #20), so Ctrl K can jump there without the console switch.
const USER_PAGES = [
  { href: "/app", label: "Home", icon: <House className={icon} /> },
  { href: "/app/chatbot", label: "Chatbot", icon: <Bot className={icon} /> },
  { href: "/app/knowledge", label: "Knowledge", icon: <BookOpen className={icon} /> },
  { href: "/app/install", label: "Install", icon: <Code2 className={icon} /> },
  { href: "/app/usage", label: "Usage", icon: <BarChart3 className={icon} /> },
  { href: "/app/billing", label: "Billing", icon: <CreditCard className={icon} /> },
];

export function AdminShell({ account, children }: { account: ShellAccount; children: ReactNode }) {
  const router = useRouter();
  return (
    <ConsoleShell
      consoleLabel="Admin"
      nav={ADMIN_NAV}
      account={account}
      consoleSwitch
      paletteActions={USER_PAGES.map((p) => ({ label: `Customer console: ${p.label}`, icon: p.icon, run: () => router.push(p.href) }))}
    >
      {children}
    </ConsoleShell>
  );
}
