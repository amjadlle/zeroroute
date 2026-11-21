import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DesignPreview } from "./DesignPreview";

export const metadata: Metadata = { title: "Design tokens", robots: { index: false } };

// Dev-only token and component preview (issue #1). Production builds render a 404.
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignPreview />;
}
