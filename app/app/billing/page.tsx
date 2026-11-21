"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { PlanCard } from "@/components/dashboard/PlanCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { useCustomer } from "../CustomerConsole";

export default function BillingPage() {
  const { profile, monthlyLimit, isPro } = useCustomer();
  return (
    <>
      <PageHeader title="Billing" description="Your plan, what it includes and how much of it you have used." />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PlanCard
          email={profile.email}
          name={profile.name}
          status={profile.status}
          monthlyLimit={monthlyLimit}
          subscriptionExpires={profile.subscription_expires}
          isPro={isPro}
        />
        <UsageCard used={profile.monthly_requests || 0} limit={monthlyLimit} />
      </div>
    </>
  );
}
