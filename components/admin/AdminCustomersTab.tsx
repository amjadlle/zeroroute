"use client";

import { useState } from "react";
import { KeyRound, Pause, Play, Plus, ScrollText, Users } from "lucide-react";
import { apiFetch } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { useToast } from "@/components/ui/Toast";
import { CreateBotDialog } from "./CreateBotDialog";
import { PLAN_LABELS } from "@/lib/constants";
import { CustomerDetailDrawer, PlanBadge, StatusBadge, UsageMeter, planLabel, type CustomerAdminItem } from "./CustomerDetailDrawer";

export type { CustomerAdminItem };

type AdminCustomersTabProps = {
  customers: CustomerAdminItem[];
  onRefresh: () => Promise<void>;
  onViewCustomerLogs?: (customerKey: string) => void;
};

const label = (c: CustomerAdminItem) => c.company || c.name || c.email;
const initials = (c: CustomerAdminItem) =>
  (c.company || c.name || c.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
export const customerCount = (n: number) => `${n.toLocaleString()} ${n === 1 ? "customer" : "customers"}`;

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
  const pro = customers.filter((c) => planLabel(c) === PLAN_LABELS.pro).length;

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
        <span className="flex min-w-0 items-center gap-2.5 text-left">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-meta font-bold text-accent">
            {initials(c)}
          </span>
          <span className="grid min-w-0">
            <span className="truncate font-medium">{c.company || c.name || "Customer"}</span>
            <span className="truncate text-meta text-text-muted">{c.email}</span>
          </span>
        </span>
      ),
    },
    { key: "monthly_limit", header: "Plan", sortable: true, cell: (c) => <PlanBadge customer={c} /> },
    { key: "monthly_requests", header: "Requests this month", sortable: true, cell: (c) => <UsageMeter customer={c} /> },
    { key: "status", header: "Status", sortable: true, cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (c) => (
        <span className="flex justify-end gap-0.5">
          <IconButton
            label={`${c.status === "active" ? "Pause" : "Resume"} ${label(c)}`}
            icon={c.status === "active" ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
            onClick={() => toggleStatus(c)}
            disabled={busy}
          />
          <IconButton label={`Rotate API key for ${label(c)}`} icon={<KeyRound aria-hidden className="size-4" />} onClick={() => rotateKey(c)} disabled={busy} />
          {onViewCustomerLogs && (
            <IconButton label={`View request log for ${label(c)}`} icon={<ScrollText aria-hidden className="size-4" />} onClick={() => onViewCustomerLogs(c.key)} />
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-3.5 py-3">
          <div className="w-full sm:w-80">
            <SearchInput
              aria-label="Search customers"
              placeholder="Search email, Bot ID or key"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-meta text-text-muted" aria-live="polite">
            {q ? `${filtered.length.toLocaleString()} of ${customerCount(customers.length)}` : `${customerCount(customers.length)} · ${pro} on ${PLAN_LABELS.pro}`}
          </p>
          <Button leftIcon={<Plus aria-hidden className="size-4" />} onClick={() => setCreating(true)} className="ml-auto">
            Create chatbot
          </Button>
        </div>
        <div className="p-2 sm:p-0">
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
        </div>
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
    </>
  );
}
