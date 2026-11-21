"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { UsageCard } from "@/components/home/UsageCard";
import { VisitorConversations } from "@/components/dashboard/VisitorConversations";
import { useCustomer } from "../CustomerConsole";

export default function UsagePage() {
  const { profile, monthlyLimit } = useCustomer();
  return (
    <>
      <PageHeader title="Usage" description="Requests used this month and what visitors asked your chatbot." />
      <div className="grid gap-4">
        <UsageCard used={profile.monthly_requests || 0} limit={monthlyLimit} />
        <VisitorConversations />
      </div>
    </>
  );
}
