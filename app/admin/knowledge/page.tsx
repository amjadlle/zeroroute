"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/PageLoader";
import { Select } from "@/components/ui/Select";
import { AddKnowledgeButton, KnowledgeList, type KnowledgeListProps, type KnowledgeSource } from "@/components/shared/knowledge/KnowledgeList";
import type { CustomerAdminItem } from "@/components/admin/AdminCustomersTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

export default function AdminKnowledgePage() {
  const { data, error, reload } = useAdminData<{ customers?: CustomerAdminItem[] }>("/api/admin/customers");
  const [picked, setPicked] = useState<string>();
  const [adding, setAdding] = useState(false);
  const customers = data?.customers ?? [];
  // Derived, not set in an effect: the list never loads for an empty key first.
  const selected = customers.some((c) => c.key === picked) ? picked : customers[0]?.key;

  return (
    <>
      <PageHeader
        title="Knowledge"
        description="What each customer's chatbot answers from. Pick a customer, then add or remove sources."
        actions={selected && <AddKnowledgeButton onClick={() => setAdding(true)} />}
      />
      {error && <LoadError what="customers" error={error} onRetry={reload} />}
      {!data ? (
        !error && <PageLoader label="Loading customers" />
      ) : !selected ? (
        <EmptyState title="No customers yet" description="Knowledge belongs to a customer's chatbot. Add a customer first." />
      ) : (
        <>
          <Field label="Customer" className="mb-4 max-w-sm">
            <Select value={selected} onChange={(e) => setPicked(e.target.value)}>
              {customers.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.company || c.name || c.bot_title || "Unnamed"} ({c.email || c.bot_id})
                </option>
              ))}
            </Select>
          </Field>
          {/* Keyed by customer: switching remounts, so a slow reply for the previous customer can't show up here. */}
          <CustomerSources key={selected} targetKey={selected} adding={adding} onAddingChange={setAdding} />
        </>
      )}
    </>
  );
}

function CustomerSources({ targetKey, ...add }: { targetKey: string } & Pick<KnowledgeListProps, "adding" | "onAddingChange">) {
  const { data, error, reload } = useAdminData<{ documents?: KnowledgeSource[] }>(
    `/api/knowledge?target_key=${encodeURIComponent(targetKey)}`,
  );
  return (
    <KnowledgeList
      sources={data ? (data.documents ?? []) : undefined}
      error={error}
      onRetry={reload}
      targetKey={targetKey}
      onChange={reload}
      {...add}
    />
  );
}
