import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { PROVIDER_COUNT } from "@/lib/constants";

// Self-hosted variable fonts (latin subset, OFL) so builds never fetch from Google Fonts (#64).
// To add a weight range or subset, download the matching woff2 from fonts.gstatic.com into app/fonts.
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

const jetbrains = localFont({
  src: "./fonts/JetBrainsMono-latin.woff2",
  variable: "--font-mono",
  weight: "100 800",
  display: "swap",
});

// Console fonts (Graphite+, issue #1). Exposed as CSS variables only; the font-ui / font-ui-mono
// tokens in globals.css read them. The landing page keeps Plus Jakarta Sans.
const geist = localFont({
  src: "./fonts/Geist-latin.woff2",
  variable: "--font-geist",
  weight: "100 900",
  preload: false, // unused on the landing page; loads when a console element uses font-ui
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: false,
  display: "swap",
});

export const viewport: Viewport = {
  // eslint-disable-next-line no-restricted-syntax -- browser UI colour must be a literal; equals --color-landing-bg
  themeColor: "#050608",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://zeroroute.mapki.in"),
  title: {
    default: "ZeroRoute — 1-Line Custom AI Chatbot & Multi-Cloud Gateway",
    template: "%s | ZeroRoute",
  },
  description:
    `Add a custom AI chatbot to your website in 1 minute. Intelligent multi-cloud routing across ${PROVIDER_COUNT} pooled AI providers (Gemini, Groq, Cerebras, Mistral, SambaNova, Cohere, and more). 10,000 monthly requests included.`,
  keywords: [
    "AI chatbot",
    "embeddable chatbot",
    "website chatbot",
    "multi-cloud LLM gateway",
    "AI router",
    "OpenAI compatible",
    "Groq",
    "Cerebras",
    "Gemini",
    "Mistral",
    "SambaNova",
    "white-label AI",
    "free AI API",
  ],
  authors: [{ name: "Amjad P A", url: "https://github.com/amjadlle" }],
  creator: "Amjad P A",
  publisher: "ZeroRoute",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "ZeroRoute — 1-Line Custom AI Chatbot & Multi-Cloud Gateway",
    description:
      `Embed a custom AI chatbot in 1 minute. Intelligent routing across ${PROVIDER_COUNT} pooled AI cloud providers with sub-8ms fallback. 10,000 monthly requests included.`,
    url: "https://zeroroute.mapki.in",
    siteName: "ZeroRoute",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeroRoute — 1-Line Custom AI Chatbot & Multi-Cloud Gateway",
    description:
      `Embed a custom AI chatbot in 1 minute. Intelligent routing across ${PROVIDER_COUNT} pooled AI cloud providers with sub-8ms fallback.`,
    creator: "@amjadlle",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: ConsoleShell's inline theme script sets data-theme on <html> before hydration (#9).
    <html lang="en" suppressHydrationWarning className={`dark scroll-smooth ${jakarta.variable} ${jetbrains.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="bg-dark-bg text-slate-100 min-h-screen font-sans antialiased selection:bg-red-500 selection:text-white">
        <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
        <Script src="/widget.js" data-bot-id="demo" strategy="afterInteractive" />
      </body>
    </html>
  );
}
