"use client";

import { useState } from "react";
import Script from "next/script";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { GatewaySection } from "@/components/GatewaySection";
import { ChatWidgetSection } from "@/components/ChatWidgetSection";
import { Features } from "@/components/Features";
import { ProviderMarquee } from "@/components/ProviderMarquee";
import { Pricing } from "@/components/Pricing";
import { CodeQuickstart } from "@/components/CodeQuickstart";
import { CreatorSection } from "@/components/CreatorSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";

export default function Home() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    // .landing (globals.css) carries the landing-only dark background and scrollbar; the consoles use the theme.
    <div className="landing relative min-h-screen text-slate-100 selection:bg-red-500 selection:text-white">
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />
      <main className="relative z-10 min-h-screen">
      <Navbar />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-4 sm:pb-6">
        <div className="space-y-24 sm:space-y-32 mt-6 sm:mt-10">
          <Hero onOpenCheckout={() => setCheckoutOpen(true)} />
          <GatewaySection />
          <ChatWidgetSection />
          <Features />
          <ProviderMarquee />
          <Pricing onOpenCheckout={() => setCheckoutOpen(true)} />
          <CodeQuickstart />
          <CreatorSection />
          <FAQSection />
          <Footer />
        </div>
      </div>
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      </main>
      {/* The demo chatbot in the corner; landing page only (#116). */}
      <Script src="/widget.js" data-bot-id="demo" strategy="afterInteractive" />
    </div>
  );
}
