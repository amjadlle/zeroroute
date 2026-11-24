"use client";

import { Suspense, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { UsageCard } from "@/components/home/UsageCard";
import { useInsights } from "@/components/home/Insights";
import { QuestionsChart } from "@/components/home/QuestionsChart";
import { downloadConversations, VisitorConversations, type Conversation } from "@/components/dashboard/VisitorConversations";
import { useCustomer } from "../CustomerConsole";

export default function UsagePage() {
  const { profile, monthlyLimit } = useCustomer();
  const insights = useInsights(true);
  const [shown, setShown] = useState<Conversation[]>([]);

  return (
    <>
      <PageHeader
        title="Usage"
        description="What visitors asked your chatbot and how it did."
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadConversations(shown)}
            disabled={shown.length === 0}
            leftIcon={<Download aria-hidden className="size-4" />}
          >
            Export CSV
          </Button>
        }
      />
      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <QuestionsChart {...insights} />
          <UsageCard used={profile.monthly_requests || 0} limit={monthlyLimit} />
        </div>
        {/* The result filter lives in the URL (useSearchParams), which needs a Suspense boundary. */}
        <Suspense>
          <VisitorConversations onShownChange={setShown} />
        </Suspense>
      </div>
    </>
  );
}
