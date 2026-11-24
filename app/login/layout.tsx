import type { Metadata } from "next";

// The page is a client component, so its title lives here.
export const metadata: Metadata = { title: "Sign in" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
