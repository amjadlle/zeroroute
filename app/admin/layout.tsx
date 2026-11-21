import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin console",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // proxy.ts already guards /admin; this keeps the pages safe if the matcher ever changes.
  const user = await getCurrentUser();
  if (user?.id !== "admin_master") redirect("/login?redirect=/admin");

  return <AdminShell account={{ name: user.name || "Admin", email: user.email, plan: "Admin" }}>{children}</AdminShell>;
}
