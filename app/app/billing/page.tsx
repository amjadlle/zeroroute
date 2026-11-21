"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import { useCustomer } from "../CustomerConsole";

export default function BillingPage() {
  const { profile, monthlyLimit, isPro } = useCustomer();
  return (
    <>
      <PageHeader title="Billing" description="Your plan and what it includes." />
      <BillingPanel isPro={isPro} monthlyRequests={profile.monthly_requests || 0} monthlyLimit={monthlyLimit} email={profile.email} />
    </>
  );
}
