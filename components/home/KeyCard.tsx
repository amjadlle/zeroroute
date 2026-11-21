import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SecretField } from "@/components/ui/SecretField";

type KeyCardProps = {
  apiKey: string;
  botId: string;
  onRotateKey: () => void;
  rotating: boolean;
  onCopyError?: (error: unknown) => void;
};

/** API key (private) and Bot ID (used by the embed snippet), masked with reveal and copy. */
export function KeyCard({ apiKey, botId, onRotateKey, rotating, onCopyError }: KeyCardProps) {
  return (
    <Card>
      <CardHeader as="h3" title="Your keys" />
      <CardBody className="grid gap-4">
        <div className="grid gap-1.5">
          <p className="text-body font-medium">Bot ID</p>
          <SecretField value={botId} label="Bot ID" onCopyError={onCopyError} />
          <p className="text-meta text-text-muted">Already filled in for you on the Install page.</p>
        </div>
        <div className="grid gap-1.5">
          <p className="text-body font-medium">API key</p>
          <SecretField value={apiKey} label="API key" onCopyError={onCopyError} />
          <p className="text-meta text-text-muted">Only for calling the API from your own server. Keep it private.</p>
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-start"
            leftIcon={<RefreshCw aria-hidden className="size-3.5" />}
            onClick={onRotateKey}
            loading={rotating}
          >
            Get a new key
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
