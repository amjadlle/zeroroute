"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { UiProviders } from "@/components/ui/UiProviders";

// Plain input until the form controls (#4) land.
const field = "h-control-md rounded-control border border-border-strong bg-surface-sunken px-2.5 text-body text-text focus-visible:outline-2 focus-visible:outline-focus-ring";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 shrink-0 text-meta text-text-subtle">{label}</span>
      {children}
    </div>
  );
}

function Examples() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [docs, setDocs] = useState(3);
  const toast = useToast();
  const confirm = useConfirm();

  const deleteDoc = async () => {
    const ok = await confirm({
      title: "Delete “Pricing FAQ”?",
      body: "Your chatbot will stop using it straight away.",
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: () => new Promise((resolve) => setTimeout(resolve, 800)),
    });
    if (!ok) return;
    setDocs((n) => n - 1);
    toast("Deleted “Pricing FAQ”", { action: { label: "Undo", onClick: () => setDocs((n) => n + 1) } });
  };

  return (
    <div className="flex flex-col gap-4">
      <Row label="modal">
        <Button variant="secondary" onClick={() => setModal(true)}>Rename chatbot</Button>
      </Row>
      <Row label="confirm">
        <Button variant="danger" leftIcon={<Trash2 className="size-4" aria-hidden />} onClick={deleteDoc}>Delete document</Button>
        <span className="text-meta text-text-muted">{docs} documents</span>
      </Row>
      <Row label="drawer">
        <Button variant="secondary" onClick={() => setDrawer(true)}>Open request details</Button>
      </Row>
      <Row label="toast">
        <Button variant="secondary" onClick={() => toast("Chatbot settings saved")}>Success</Button>
        <Button variant="secondary" onClick={() => toast("Website re-sync started", { tone: "info" })}>Info</Button>
        <Button variant="secondary" onClick={() => toast("You have used 90% of this month's questions", { tone: "warning" })}>Warning</Button>
        <Button variant="secondary" onClick={() => toast("Couldn't save. Check your connection and try again.", { tone: "danger" })}>Danger</Button>
      </Row>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Rename chatbot"
        description="Visitors see this name at the top of the chat window."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" form="rename-form">Save</Button>
          </>
        }
      >
        <form
          id="rename-form"
          className="flex flex-col gap-1.5"
          onSubmit={(e) => { e.preventDefault(); setModal(false); toast("Chatbot renamed"); }}
        >
          <label htmlFor="bot-name" className="text-meta font-medium text-text-muted">Name</label>
          <input id="bot-name" defaultValue="Harbor Yoga assistant" className={field} />
        </form>
      </Modal>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Request at 14:02:11" description="Acme Studio · gpt-4o-mini">
        <dl className="grid grid-cols-3 gap-x-4 gap-y-2">
          {[["Status", "200 OK"], ["Provider", "Groq"], ["Latency", "412 ms"], ["Tokens", "1,284"], ["Cache", "Miss"]].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-text-muted">{k}</dt>
              <dd className="col-span-2 font-ui-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </Drawer>
    </div>
  );
}

export default function OverlaysSection() {
  return (
    <UiProviders>
      <Examples />
    </UiProviders>
  );
}
