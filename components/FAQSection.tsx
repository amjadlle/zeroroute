"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How does ZeroRoute provide free AI LLMs?",
    answer:
      "Major AI inference cloud providers like Groq, Cerebras, SambaNova, Mistral, Cloudflare, and Google provide free developer tier quotas. ZeroRoute aggregates and load balances across all these free tiers into a single stable OpenAI-compatible gateway with automatic rate-limit failover.",
  },
  {
    question: "What happens when one provider hits rate limits (HTTP 429)?",
    answer:
      "When a provider returns a 429 (Rate Limit) or 502 (Outage), ZeroRoute's intelligent routing engine catches the error and instantly cascades to the next best provider in under 8 milliseconds, ensuring your visitors never experience dropped chats or errors.",
  },
  {
    question: "Can I embed the chatbot on my website without coding?",
    answer:
      "Yes! Simply paste the 1-line script tag before your closing </body> tag. It works instantly on Shopify, WordPress, Webflow, Next.js, Framer, or raw HTML websites with complete brand customization and origin security.",
  },
  {
    question: "How does the live knowledge base grounding work?",
    answer:
      "You can paste Google Docs published links, Notion public pages, GitHub markdown files, or website FAQs. ZeroRoute crawls and indexes the text into high-performance semantic search so the chatbot answers strictly using your verified business documentation.",
  },
  {
    question: "Is ZeroRoute open source?",
    answer:
      "Yes! The core ZeroRoute proxy engine is 100% open source under the MIT License on GitHub. You can self-host it on your own Cloudflare Workers account for free or use our hosted ZeroRoute Cloud for instant managed setups.",
  },
  {
    question: "How does the 3-day free trial work for Starter Pro?",
    answer:
      "You get complete access to 2,000 monthly chat requests, hosted Cloudflare D1 SQL database, 5-in-1 live knowledge sync, and website chatbot widget for 3 full days completely free. You can cancel anytime before the trial ends without being charged.",
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-semibold font-mono">
          <span>❓ FREQUENTLY ASKED QUESTIONS</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Got Questions? We&apos;ve Got Answers.
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Everything you need to know about the product, failover architecture, and pricing.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-red-400 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-red-400" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}