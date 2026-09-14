"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TerminalFailover } from "@/components/TerminalFailover";
import { ChatWidgetSection } from "@/components/ChatWidgetSection";
import { Features } from "@/components/Features";
import { ProviderMarquee } from "@/components/ProviderMarquee";
import { Pricing } from "@/components/Pricing";
import { CodeQuickstart } from "@/components/CodeQuickstart";
import { CreatorSection } from "@/components/CreatorSection";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";

export default function Home() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-4 sm:pb-6">
        <div className="space-y-24 sm:space-y-32 mt-6 sm:mt-10">
          <Hero onOpenCheckout={() => setCheckoutOpen(true)} />
          <TerminalFailover />
          <ChatWidgetSection />
          <Features />
          <ProviderMarquee />
          <Pricing onOpenCheckout={() => setCheckoutOpen(true)} />
          <CodeQuickstart />
          <CreatorSection />
          <Footer />
        </div>
      </div>
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </main>
  );
}
