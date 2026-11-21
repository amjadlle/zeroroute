"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { KnowledgeTab } from "@/components/dashboard/KnowledgeTab";
import { apiFetch } from "@/lib/client/api";
import { failMsg, useCustomer } from "../CustomerConsole";

export default function KnowledgePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { docs, refreshDocs, refreshProfile } = useCustomer();
  const [adding, setAdding] = useState(false);

  const addDoc = async (title: string, content: string) => {
    setAdding(true);
    try {
      await apiFetch("/api/knowledge", { method: "POST", body: { title, content, type: "manual_text" } });
      await Promise.all([refreshDocs(), refreshProfile()]);
    } catch (e) {
      toast(`Couldn't add this source: ${failMsg(e)}`, { tone: "danger" });
      throw e; // keeps the KnowledgeTab modal open so the typed text is not lost
    } finally {
      setAdding(false);
    }
  };

  const deleteDoc = async (id: string) => {
    await confirm({
      title: "Delete this source?",
      body: "Your chatbot will stop using it to answer questions.",
      confirmLabel: "Delete",
      tone: "danger",
      // A failure keeps the dialog open and shows the error there.
      onConfirm: async () => {
        await apiFetch(`/api/knowledge?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        await Promise.all([refreshDocs(), refreshProfile()]);
      },
    });
  };

  return (
    <>
      <PageHeader title="Knowledge" description="What your chatbot knows about your business." />
      <KnowledgeTab docs={docs} onAddDoc={addDoc} onDeleteDoc={deleteDoc} onRefresh={refreshDocs} addingDoc={adding} />
    </>
  );
}
