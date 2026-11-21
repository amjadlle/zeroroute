"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { VisitorLog } from "@/components/dashboard/VisitorLog";
import { useCustomer } from "../CustomerConsole";

export default function UsagePage() {
  const { profile, monthlyLimit } = useCustomer();
  return (
    <>
      <PageHeader
        title="Usage"
        description={`${(profile.monthly_requests || 0).toLocaleString()} of ${monthlyLimit.toLocaleString()} requests used this month.`}
      />
      <VisitorLog />
    </>
  );
}
