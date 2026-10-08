# ZeroRoute — Verified Knowledge Base

## Product Overview
ZeroRoute (https://zeroroute.mapki.in) is an open-source, multi-cloud AI Gateway and 1-Line Custom AI Chatbot platform. It pools quotas across 11 top AI cloud providers into a unified, high-availability OpenAI-compatible endpoint with sub-8ms dynamic auto-failover and zero downtime.

## Dual Core Value Proposition

### 1. 1-Line Embeddable AI Website Chatbot
- **Instant 1-Minute Embed**: Embed on any HTML or modern web app (WordPress, Webflow, Shopify, Next.js, React) using a single `<script>` tag:
  ```html
  <script src="https://zeroroute.mapki.in/widget.js" data-bot-id="your_bot_id_here" defer></script>
  ```
- **Live Streaming SSE**: Token-by-token real-time typewriter response stream.
- **Customizable UI**: Configure custom bot title, role, greeting, brand accent color, avatar, and quick suggestion pills in the Subscriber Console (`/app`).
- **Semantic Document & URL Crawler**: Index public website URLs, Google Docs (`/pub`), Notion public pages, and GitHub raw Markdown (`.md`) with built-in SSRF protection.
- **Zero Hallucination Policy**: Grounded to answer strictly using verified business documents without making up contact details, prices, or fake policies.
- **White-Label Option**: Pro tier removes all "Powered by ZeroRoute" branding.

### 2. OpenAI-Compatible Multi-Cloud API Gateway
- **Drop-in Replacement**: Fully compatible with `https://api.openai.com/v1/chat/completions` and official OpenAI SDKs (Python, TypeScript, Node.js, cURL, LangChain, Cursor, Claude Code).
- **11 Pooled AI Clouds**: Groq, Cerebras, SambaNova, Mistral AI, Google Gemini, NVIDIA NIM, Cohere, OpenRouter, Cloudflare Workers AI, Hugging Face, and BazaarLink.
- **Sub-8ms Dynamic Routing**: Automatically detects rate limits (HTTP 429) or cloud downtime (HTTP 5xx) and dispatches requests to the next healthy provider in milliseconds.
- **0ms RAM Caching**: Identical queries are served instantly with zero API credit consumption.

---

## Pricing & Subscription Tiers

### 1. Free Tier ($0 / month)
- **500 Requests / Month** (auto-resets every 30 days).
- 1 Whitelisted website domain.
- Embeddable AI Chatbot widget with badge.
- OpenAI-compatible API Gateway access.
- Sub-8ms multi-cloud routing with fallback.
- Community support & open-source MIT license.

### 2. Pro Tier ($2.00 / month or $24.00 / year)
- **10,000 Requests / Month** (~330 requests / day).
- **White-Label Chatbot**: 100% clean branding removal.
- Up to 3 whitelisted website domains.
- Priority multi-cloud routing with zero rate-limit queuing.
- Live Web Crawler & Knowledge Document Manager.
- Unlimited API key rotations and custom persona tuning.
- Powered by Dodo Payments secure billing.

---

## Supported AI Cloud Providers

1. **Groq**: ~100ms ultra-fast inference (`openai/gpt-oss-20b`, `llama-3.3-70b-versatile`)
2. **Cerebras**: ~80ms wafer-scale high-speed inference (`llama3.1-8b`, `llama-3.3-70b`)
3. **SambaNova**: ~360ms high throughput inference (`gemma-4-31B-it`, `Meta-Llama-3.1-70B-Instruct`)
4. **Mistral AI**: ~390ms European privacy & reasoning (`mistral-small-latest`, `open-mistral-nemo`)
5. **Google Gemini**: ~710ms 1M+ token context (`gemini-2.0-flash`, `gemini-2.5-flash`)
6. **NVIDIA NIM**: ~260ms DGX enterprise infrastructure (`nvidia/nemotron-3.5-lightning-30b-a3b`)
7. **OpenRouter**: Open-source free model pool (`meta-llama/llama-3.3-70b-instruct:free`)
8. **Cloudflare Workers AI**: Global edge inference (`@cf/meta/llama-3.1-8b-instruct`)
9. **Cohere**: Conversational reasoning (`command-r-plus-08-2024`)
10. **Hugging Face**: Serverless inference router (`meta-llama/Llama-3.1-8B-Instruct`)
11. **BazaarLink AI**: Distributed inference pool (`Qwen/Qwen2.5-72B-Instruct`)

---

## Security & Reliability Architecture
- **Edge Route Guards**: Next.js 16 edge proxy (`proxy.ts`) protects administrative and subscriber dashboards.
- **Atomic Quota Enforcement**: Atomic database check-and-increment eliminates concurrency bypasses under high serverless traffic.
- **Cryptographically Secure PRNG**: All OTPs, API keys, and session tokens are generated with Node.js `crypto`.
- **SSRF Hardened Crawler**: Blocks private IPv4 (10.x, 192.168.x, 172.16-31.x, 127.x, 169.254.x), IPv6 link-local (fe80:, fd00:), and metadata endpoints.
- **Security Headers**: HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, and strict referrer policy.
- **Dodo Payments Integration**: Automated HMAC-SHA256 signature verification and replay-protected webhooks.

---

## Important Links & Resources
- **Live SaaS Platform**: https://zeroroute.mapki.in
- **Subscriber Console**: https://zeroroute.mapki.in/app
- **Admin Console**: https://zeroroute.mapki.in/admin
- **GitHub Repository**: https://github.com/amjadlle/zeroroute
- **Creator / Maintainer**: Amjad P A ([amjad.mapki.in](https://amjad.mapki.in) / [@amjadlle](https://github.com/amjadlle))
- **Support & Buy Me a Coffee**: https://buymeacoffee.com/amjadlle
- **License**: MIT License
