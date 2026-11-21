"use client";

import { useState, type FormEvent } from "react";
import { Globe, Plus, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { PLAN_LIMITS } from "@/lib/constants";

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

/**
 * Turns what a customer typed ("https://Shop.example.com/page") into the host the gateway matches
 * ("shop.example.com"), or null when it isn't a hostname. Accepts localhost, IPv4 and a leading
 * "*." wildcard, mirroring isHostAllowed in lib/providers/gateway.ts.
 */
export function normalizeDomain(input: string): string | null {
  const host = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "");
  if (host === "localhost" || IPV4.test(host)) return host;
  const name = host.startsWith("*.") ? host.slice(2) : host;
  const labels = name.split(".");
  const ok = name.length <= 253 && labels.length >= 2 && labels.every((l) => LABEL.test(l)) && /^[a-z]{2,63}$|^xn--/.test(labels.at(-1)!);
  return ok ? host : null;
}

type DomainsCardProps = {
  domains: string[];
  isPro: boolean;
  /** Saves the full list; rejects with the server's message on failure. */
  onSave: (domains: string[]) => Promise<void>;
};

const failMsg = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong.");

export function DomainsCard({ domains, isPro, onSave }: DomainsCardProps) {
  const confirm = useConfirm();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const max = (isPro ? PLAN_LIMITS.pro : PLAN_LIMITS.free).allowedDomains;
  const full = domains.length >= max;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const host = normalizeDomain(input);
    if (!host) return setError("Enter a website address like yourshop.com or blog.yourshop.com.");
    if (domains.includes(host)) return setError(`${host} is already on the list.`);
    setSaving(true);
    try {
      await onSave([...domains, host]);
      setInput("");
      setError("");
    } catch (err) {
      setError(`Couldn't add ${host}: ${failMsg(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = (host: string) =>
    confirm({
      title: `Remove ${host}?`,
      body:
        domains.length === 1
          ? "Your chatbot will load on any website until you add a domain again."
          : `Your chatbot will stop loading on ${host}.`,
      confirmLabel: "Remove",
      tone: "danger",
      // A failure keeps the dialog open and shows the error there.
      onConfirm: () => onSave(domains.filter((d) => d !== host)),
    });

  return (
    <Card>
      <CardHeader
        title="Allowed domains"
        description="The websites where your chatbot is allowed to load."
        actions={<Badge>{`${domains.length} of ${max}`}</Badge>}
      />
      <CardBody className="grid gap-4">
        {domains.length === 0 ? (
          <Alert tone="warning" title="Your chatbot can load on any website">
            Add your website so nobody else can put your chatbot on theirs.
          </Alert>
        ) : (
          <ul className="grid gap-2">
            {domains.map((d) => (
              <li key={d} className="flex items-center gap-2 rounded-control border border-border bg-surface-sunken py-0.5 pr-0.5 pl-3">
                <Globe aria-hidden className="size-4 shrink-0 text-text-subtle" />
                <span className="min-w-0 flex-1 truncate font-ui-mono text-body">{d}</span>
                <IconButton label={`Remove ${d}`} icon={<X aria-hidden className="size-4" />} onClick={() => remove(d)} />
              </li>
            ))}
          </ul>
        )}

        {full ? (
          <p className="text-meta text-text-muted">
            {isPro ? (
              `You're using all ${max} allowed domains on your plan. Remove one to add another.`
            ) : (
              <>
                The Free plan includes {max} allowed domain.{" "}
                <Button href="/app/billing" variant="link" className="text-meta">
                  Upgrade to Pro for {PLAN_LIMITS.pro.allowedDomains}
                </Button>
              </>
            )}
          </p>
        ) : (
          <form onSubmit={add} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Field label="Website address" error={error} className="flex-1">
              <Input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError("");
                }}
                placeholder="yourshop.com"
                autoComplete="off"
                spellCheck={false}
                disabled={saving}
              />
            </Field>
            <Button type="submit" variant="secondary" loading={saving} disabled={!input.trim()} leftIcon={<Plus aria-hidden className="size-4" />} className="sm:mt-6.5">
              Add domain
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
