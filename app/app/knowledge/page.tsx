"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { AddKnowledgeButton, KnowledgeList } from "@/components/shared/knowledge/KnowledgeList";
import { useCustomer } from "../CustomerConsole";

export default function KnowledgePage() {
  const { docs, docsError, refreshDocs, refreshProfile } = useCustomer();
  const [adding, setAdding] = useState(false);

  return (
    <>
      <PageHeader
        title="Knowledge"
        description="What your chatbot knows about your business."
        actions={<AddKnowledgeButton onClick={() => setAdding(true)} />}
      />
      <KnowledgeList
        sources={docs}
        error={docsError}
        onRetry={refreshDocs}
        onChange={() => Promise.all([refreshDocs(), refreshProfile()])}
        adding={adding}
        onAddingChange={setAdding}
      />
    </>
  );
}
