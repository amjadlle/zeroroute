"use client";

import { useState } from "react";
import { ArrowRight, Copy, Download, MoreHorizontal, Plus, Settings, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Spinner } from "@/components/ui/Spinner";
import { PageLoader } from "@/components/ui/PageLoader";

const VARIANTS = ["primary", "secondary", "ghost", "danger", "link"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const icon = "size-4";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 shrink-0 text-meta text-text-subtle">{label}</span>
      {children}
    </div>
  );
}

export default function ButtonsSection() {
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => (
        <Row key={variant} label={variant}>
          {SIZES.map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant === "link" ? "Link" : `Button ${size}`}
            </Button>
          ))}
          <Button variant={variant} disabled>Disabled</Button>
        </Row>
      ))}

      <Row label="loading">
        <Button loading={saving} onClick={save}>{saving ? "Saving" : "Click to save"}</Button>
        <Button variant="secondary" loading>Saving changes</Button>
        <Button variant="danger" size="lg" loading>Delete</Button>
        <Button variant="ghost" size="sm" loading>Refresh</Button>
      </Row>

      <Row label="icons">
        <Button leftIcon={<Plus className={icon} aria-hidden />}>New bot</Button>
        <Button variant="secondary" rightIcon={<ArrowRight className={icon} aria-hidden />}>Continue</Button>
        <Button variant="ghost" leftIcon={<Download className={icon} aria-hidden />}>Export</Button>
        <Button variant="danger" leftIcon={<Trash2 className={icon} aria-hidden />}>Delete</Button>
      </Row>

      <Row label="as link">
        <Button href="#buttons" variant="secondary">In-page anchor</Button>
        <Button href="/design" rightIcon={<ArrowRight className={icon} aria-hidden />}>Next Link</Button>
        <Button href="https://nextjs.org/docs" variant="link" target="_blank" rel="noreferrer">External docs</Button>
      </Row>

      <Row label="icon button">
        <IconButton label="Copy" icon={<Copy className={icon} aria-hidden />} />
        <IconButton label="Settings" variant="secondary" icon={<Settings className={icon} aria-hidden />} />
        <IconButton label="Add" variant="primary" icon={<Plus className={icon} aria-hidden />} />
        <IconButton label="Delete" variant="danger" size="lg" icon={<Trash2 className={icon} aria-hidden />} />
        <IconButton label="More actions" size="lg" icon={<MoreHorizontal className={icon} aria-hidden />} />
        <IconButton label="Close" disabled icon={<X className={icon} aria-hidden />} />
      </Row>

      <Row label="spinner">
        <span className="flex items-center gap-3 text-text-muted">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" label="Loading" />
        </span>
      </Row>

      <div className="rounded-card border border-border bg-surface-sunken">
        <PageLoader label="Loading page" className="min-h-40" />
      </div>
    </div>
  );
}
