import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CustomerConsole } from "./CustomerConsole";

export const metadata: Metadata = { title: "Customer console", robots: { index: false } };

export default function AppLayout({ children }: { children: ReactNode }) {
  return <CustomerConsole>{children}</CustomerConsole>;
}
