import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Welcome } from "@/components/welcome/Welcome";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default function WelcomePage() {
  return (
    <Suspense fallback={<PageLoader className="min-h-dvh bg-bg" />}>
      <Welcome />
    </Suspense>
  );
}
