"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { apiFetch } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/components/ui/Toast";
import { CreateBotDialog } from "./CreateBotDialog";
import { CustomerDetailDrawer, StatusBadge, UsageMeter, planLabel, type CustomerAdminItem } from "./CustomerDetailDrawer";

export type { CustomerAdminItem };

type AdminCustomersTabProps = {
  customers: CustomerAdminItem[];
  onRefresh: () => Promise<void>;
  onViewCustomerLogs?: (customerKey: string) => void;
};

const label = (c: CustomerAdminItem) => c.company || c.name || c.email;

export function AdminCustomersTab({ customers, onRefresh, onViewCustomerLogs }: AdminCustomersTabProps) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  // Read the open customer from the latest list, so a refresh shows the new key or status in the drawer.
  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) => [c.email, c.company, c.name, c.bot_id, c.key].some((v) => v?.toLowerCase().includes(q)))
    : customers;

  const patch = (c: CustomerAdminItem, body: object) =>
    apiFetch("/api/admin/customers", { method: "PATCH", body: { id: c.id, ...body } });

  const rotateKey = (c: CustomerAdminItem) =>
    confirm({
      title: `Rotate the API key for ${label(c)}?`,
      body: "The current key stops working right away. Anything that uses it needs the new key.",
      confirmLabel: "Rotate key",
      onConfirm: async () => {
        await patch(c, { rotateKey: true });
        await onRefresh();
        toast("API key rotated");
      },
    });

  const toggleStatus = async (c: CustomerAdminItem) => {
    if (c.status === "active") {
      await confirm({
        title: `Pause ${label(c)}?`,
        body: "Their chatbot and API key stop working until you resume them.",
        confirmLabel: "Pause",
        onConfirm: async () => {
          await patch(c, { status: "paused" });
          await onRefresh();
          toast("Customer paused");
        },
      });
      return;
    }
    setBusy(true);
    try {
      await patch(c, { status: "active" });
      await onRefresh();
      toast("Customer resumed");
    } catch (err) {
      toast(`Could not resume: ${(err as Error).message}`, { tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  const remove = (c: CustomerAdminItem) =>
    confirm({
      title: `Delete ${label(c)}?`,
      body: "This removes the customer, their API key, knowledge and request log. It can't be undone.",
      confirmLabel: "Delete customer",
      tone: "danger",
      onConfirm: async () => {
        await apiFetch(`/api/admin/customers?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
        setSelectedId(null);
        await onRefresh();
        toast("Customer deleted");
      },
    });

  const columns: Column<CustomerAdminItem>[] = [
    {
      key: "company",
      header: "Customer",
      sortable: true,
      cell: (c) => (
        <span className="grid sm:text-left">
          <span className="font-medium">{c.company || c.name || "Customer"}</span>
          <span className="text-meta text-text-muted">{c.email}</span>
        </span>
      ),
    },
    { key: "monthly_limit", header: "Plan", sortable: true, cell: planLabel },
    { key: "monthly_requests", header: "Requests this month", sortable: true, cell: (c) => <UsageMeter customer={c} /> },
    { key: "status", header: "Status", sortable: true, cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (c) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedId(c.id)} aria-label={`Manage ${label(c)}`}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          aria-label="Search customers"
          placeholder="Search email, Bot ID or key"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-72"
        />
        <p className="text-meta text-text-muted">
          {q ? `${filtered.length} of ${customers.length}` : customers.length} customers
        </p>
        <Button leftIcon={<Plus aria-hidden className="size-4" />} onClick={() => setCreating(true)} className="ml-auto">
          Create chatbot
        </Button>
      </div>

      <Card className="p-2 sm:p-0">
        <DataTable
          label="Customers"
          columns={columns}
          rows={filtered}
          getRowId={(c) => c.id}
          onRowClick={(c) => setSelectedId(c.id)}
          empty={
            <EmptyState
              icon={Users}
              title={q ? "No customers match your search" : "No customers yet"}
              description={q ? "Try an email, Bot ID or part of a key." : "Create a chatbot for one of your sites to get started."}
            />
          }
        />
      </Card>

      <CustomerDetailDrawer
        customer={selected}
        onClose={() => setSelectedId(null)}
        onViewLogs={onViewCustomerLogs}
        onRotateKey={rotateKey}
        onToggleStatus={toggleStatus}
        onDelete={remove}
        busy={busy}
      />
      <CreateBotDialog open={creating} onClose={() => setCreating(false)} onCreated={onRefresh} />
    </div>
  );
}
