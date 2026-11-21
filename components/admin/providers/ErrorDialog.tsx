"use client";

import { Modal } from "@/components/ui/Modal";
import { CopyButton } from "@/components/ui/CopyButton";
import type { ProviderItem } from "./helpers";

/** The provider's last error message in full. */
export function ErrorDialog({ provider, onClose }: { provider: ProviderItem | null; onClose: () => void }) {
  return (
    <Modal
      open={Boolean(provider)}
      onClose={onClose}
      title={provider ? `${provider.name}: last error` : ""}
      footer={provider?.lastError ? <CopyButton value={provider.lastError} label="Copy error" variant="text" /> : undefined}
    >
      <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-control bg-surface-sunken p-3 font-ui-mono text-meta text-text">
        {provider?.lastError}
      </pre>
    </Modal>
  );
}
