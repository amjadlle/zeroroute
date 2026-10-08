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
  title: "ZeroRoute — 1-Line Custom AI Chatbot & Multi-Cloud Gateway",
  description: "Add a custom AI chatbot to your website in 1 minute. Intelligent multi-cloud routing across 11 pooled AI providers (Gemini, Groq, Cerebras, Mistral, SambaNova, Cohere, and more). 10,000 monthly requests included.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/icon.png", type: "image/png" }
    ],
    shortcut: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "ZeroRoute — 1-Line Custom AI Chatbot & Multi-Cloud Gateway",
    description: "Embed an AI customer chatbot in 1 minute. Intelligent routing across 11 pooled AI cloud providers with sub-8ms fallback. 10,000 monthly requests included.",
    url: "https://zeroroute.mapki.in",
    siteName: "ZeroRoute",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeroRoute — 1-Line Custom AI Chatbot & Multi-Cloud Gateway",
    description: "Embed a custom AI chatbot in 1 minute. Intelligent routing across 11 pooled AI cloud providers with sub-8ms fallback.",
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
