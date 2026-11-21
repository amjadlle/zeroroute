"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { ApiQuickstart } from "@/components/install/ApiQuickstart";
import { PlatformGuides } from "@/components/install/PlatformGuides";
import { SnippetCard, linkClass } from "@/components/install/SnippetCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useCustomer } from "../CustomerConsole";

export default function InstallPage() {
  const { profile } = useCustomer();
  return (
    <>
      <PageHeader title="Install" description="Add your chatbot to your website, or call the API from your own code." />
      <div className="space-y-6">
        <SnippetCard botId={profile.bot_id} />
        <PlatformGuides botId={profile.bot_id} />
        <Card>
          <CardHeader title="3. Check it works" />
          <CardBody>
            <ul className="list-disc space-y-1.5 pl-5 text-body text-text">
              <li>Open your website. A chat button appears in the bottom-right corner.</li>
              <li>Click it and ask a question to make sure your chatbot answers.</li>
              <li>
                No reply? If you set <Link href="/app" className={linkClass}>allowed domains</Link>, check your site&apos;s
                domain is on the list.
              </li>
              <li>No button? Refresh the page without the cache (Ctrl+Shift+R, or Cmd+Shift+R on a Mac).</li>
            </ul>
          </CardBody>
        </Card>
        <ApiQuickstart apiKey={profile.key} />
      </div>
    </>
  );
}
