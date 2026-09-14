import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#050608",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "ZeroRoute — $0/mo Multi-Cloud AI Gateway for Solo Founders & Startups",
  description: "Never pay for LLMs again. One OpenAI-compatible endpoint with automatic failover across 8 free cloud AI providers and a 1-line website chatbot widget.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "ZeroRoute — $0/mo Multi-Cloud AI Gateway",
    description: "Never pay for LLMs again. Automatic failover across 8 free AI providers (Mistral, Groq, Cohere, Cloudflare, SambaNova, Gemini, OpenRouter, NVIDIA). 100% free forever.",
    url: "https://zeroroute.mapki.in",
    siteName: "ZeroRoute",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeroRoute — $0/mo Multi-Cloud AI Gateway",
    description: "Automatic failover across 8 free AI cloud providers. 0% downtime, 0 dependencies, 100% free forever.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark scroll-smooth ${jakarta.variable} ${jetbrains.variable}`}>
      <body className="bg-[#050608] text-slate-100 min-h-screen font-sans antialiased selection:bg-red-500 selection:text-white">
        <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
        <Script src="/widget.js" data-bot-id="demo" strategy="afterInteractive" />
      </body>
    </html>
  );
}
