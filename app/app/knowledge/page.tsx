"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { KnowledgeList } from "@/components/shared/knowledge/KnowledgeList";
import { useCustomer } from "../CustomerConsole";

export default function KnowledgePage() {
  const { docs, docsError, refreshDocs, refreshProfile } = useCustomer();

  return (
    <>
      <PageHeader title="Knowledge" description="What your chatbot knows about your business." />
      <KnowledgeList
        sources={docs}
        error={docsError}
        onRetry={refreshDocs}
        onChange={() => Promise.all([refreshDocs(), refreshProfile()])}
      />
    </>
  );
}
