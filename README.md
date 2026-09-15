<div align="center">

# ⚡ ZeroRoute SaaS
### Open-Source Multi-Cloud AI Gateway & Autonomous Embeddable Widget Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.5_(Turbopack)-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS_v4-38bdf8.svg)](https://tailwindcss.com/)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare_D1_%2B_SQLite-F38020.svg)](https://developers.cloudflare.com/d1/)
[![Dodo Payments](https://img.shields.io/badge/Billing-Dodo_Payments-00E599.svg)](https://dodopayments.com/)

**Zero Cost. Max Route. 100% Uptime Across 11 Free AI Cloud Providers.**

[Live Demo](https://zeroroute.mapki.in) • [Documentation](DEPLOYMENT.md) • [Report Bug](https://github.com/amjadlle/zeroroute/issues)

</div>

---

## 🌟 What is ZeroRoute?

**ZeroRoute** is a production-grade, OpenAI-compatible AI API Gateway and turnkey SaaS platform built on **Next.js 16 (Turbopack)**. It intelligently aggregates **11 high-performance AI cloud provider free tiers** into a unified, zero-cost, fault-tolerant cluster with instant sub-second failover.

Whether you need a **1-line embeddable AI customer support chatbot** trained on your live website, or a **resilient OpenAI-compatible gateway** for your Cursor, Claude Code, Python, or TypeScript applications, ZeroRoute ensures you never see a `429 Rate Limit Exceeded` or `503 Service Unavailable` error again.

---

## ✨ Key Features

### 🌐 1. High-Availability Multi-Cloud Routing Matrix
- **11 Configured Free AI Cloud Providers:** Groq, Cerebras, SambaNova, Mistral AI, Cohere, Google Gemini, OpenRouter, NVIDIA NIM, Cloudflare Workers AI, Hugging Face, and BazaarLink AI.
- **Intra-Provider Fallback Chains:** Each provider has a prioritized model chain that automatically cycles through alternative model sizes before escalating to the next cloud tier.
- **Dynamic Failover Engine:** Automatically detects HTTP `429`, `500`, `502`, `503`, or timeouts and fails over in <300ms without dropping user streams.

### 💬 2. 1-Line Embeddable Chatbot Widget
- Embed on any website with a single `<script>` tag:
  ```html
  <script
    src="https://zeroroute.mapki.in/widget.js"
    data-bot-id="bot_your_bot_id_here"
    defer
  ></script>
  ```
- Floating glassmorphism chat window, live streaming SSE token typewriter effect, customizable quick-action pills, brand accent colors, and custom avatar.

### 🧠 3. Smart Semantic RAG & 1-Click URL Crawler
- **1-Click Web Scraper:** Index public websites, Notion documents, Google Docs (`/pub`), and GitHub raw markdown (`.md`) with built-in SSRF protection.
- **BM25 Token Scorer:** Retrieves relevant context snippets based on user queries and injects verified business details directly into system prompts.
- **Zero Hallucination Directives:** Restricts the AI from inventing fake prices, phone numbers, or URLs not present in the verified knowledge base.

### 👑 4. Master Admin Console (`/admin`)
- **Visual Fallback Chain Reordering:** Drag-and-drop or use 1-click controls to promote/demote clouds and models.
- **Multi-Cloud Benchmark Race:** Race all 11 clouds simultaneously with 1 click to measure live latencies.
- **Subscriber Directory & Quota Management:** Monitor paying tenants, rotate API keys, inspect usage meters, and suspend/activate tenants.
- **Live Gateway Traffic & Failover Log Inspector:** Inspect full user prompts, model responses, tokens, and multi-cloud failover trails.

### 👤 5. Subscriber Console (`/app`) & 10,000 Monthly Quota
- **10,000 Monthly AI Requests (~330 req/day):** Generous multi-cloud allocation per subscriber with automated monthly cycle resets.
- **Self-Service Dashboard:** Rotate live API keys, customize AI persona/tone/greetings, manage knowledge docs, and copy integration code.
- **Domain Whitelisting (CORS):** Lock down widget usage to authorized customer domains.
- **Turnkey Subscription Billing:** Powered by Dodo Payments with automated activation, renewal, and cancellation webhooks.

### 🗄️ 6. Dual-Engine Database Architecture
- **Edge Mode:** Zero-cold-start Cloudflare D1 Serverless Database.
- **Local / Node.js Mode:** Embedded high-speed SQLite via `@libsql/client` (`data/zeroroute.db`).

---

## 🏗️ Architecture & Fallback Hierarchy

```mermaid
flowchart TD
    User([Client / Widget / OpenAI SDK]) --> Gateway[ZeroRoute API Gateway /v1/chat/completions]
    
    Gateway --> RAG[RAG Retrieval Engine]
    RAG --> Cache{Response Cache}
    
    Cache -- Cache Hit --> Immediate[Cached Response (0ms)]
    Cache -- Cache Miss --> ProviderPool[Dynamic Multi-Cloud Pool]

    subgraph "11 Cloud Fallback Matrix"
        P1[1. Groq - Llama 3.3 / GPT-OSS]
        P2[2. Cerebras - Ultra-Fast 120B]
        P3[3. SambaNova - MiniMax / Gemma 4]
        P4[4. Mistral AI - Nemo / Ministral]
        P5[5. Cohere - Command R+]
        P6[6. Google Gemini - 2.0 / 2.5 Flash]
        P7[7. OpenRouter - Nemotron Super 120B]
        P8[8. NVIDIA NIM - Nemotron 30B]
        P9[9. Cloudflare AI - Llama 3.1 8B]
        P10[10. Hugging Face - Llama 3.1 8B]
        P11[11. BazaarLink AI - Qwen 2.5]
    end

    ProviderPool --> P1
    P1 -- 429 / Timeout --> P2
    P2 -- 429 / Timeout --> P3
    P3 -- 429 / Timeout --> P4
    P4 -- 429 / Timeout --> P5
    P5 -- 429 / Timeout --> P6
    P6 -- 429 / Timeout --> P7
    P7 -- 429 / Timeout --> P8
    P8 -- 429 / Timeout --> P9
    P9 -- 429 / Timeout --> P10
    P10 -- 429 / Timeout --> P11
```

---

## ⚡ Quickstart & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/amjadlle/zeroroute.git
cd zeroroute
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Application Base URL
APP_URL=http://localhost:3000

# Superadmin Access
ADMIN_EMAIL=admin@zeroroute.io
ADMIN_PASSWORD=your_secure_password
ADMIN_KEY=zr_admin_master_secret_key
ROUTER_API_KEY=zr_admin_master_secret_key

# (Optional) Add your free provider API keys
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
CEREBRAS_API_KEY=...
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
* **Landing Page:** `http://localhost:3000`
* **Subscriber Console:** `http://localhost:3000/app`
* **Master Admin Console:** `http://localhost:3000/admin`

---

## 💻 API Gateway Usage (OpenAI Compatible)

ZeroRoute is a drop-in replacement for `https://api.openai.com/v1`.

### JavaScript / TypeScript (Official OpenAI SDK)
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://zeroroute.mapki.in/v1", // or http://localhost:3000/v1
  apiKey: "zr_live_YOUR_API_KEY",
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "auto", // Automatically routes and fails over across 11 clouds
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Explain quantum computing in one sentence." }
    ],
    stream: true,
  });

  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();
```

### Python (Official OpenAI SDK)
```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://zeroroute.mapki.in/v1",
    api_key="zr_live_YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="auto",
    messages=[
        {"role": "user", "content": "How does multi-cloud failover work?"}
    ]
)

print(response.choices[0].message.content)
```

### cURL
```bash
curl -X POST https://zeroroute.mapki.in/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer zr_live_YOUR_API_KEY" \
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Ping test"}
    ],
    "stream": false
  }'
```

---

## 🚀 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment walkthroughs across:
- **Vercel** (1-Click Deployment)
- **Cloudflare Pages / OpenNext** (Cloudflare D1 edge database)
- **Docker / VPS / PM2** (Node.js standalone server)

---

## 👨‍💻 Creator & Maintainer

**Amjad P A**
* Website: [amjad.mapki.in](https://amjad.mapki.in)
* GitHub: [@amjadlle](https://github.com/amjadlle)
* X / Twitter: [@amjadlle](https://x.com/amjadlle)
* LinkedIn: [linkedin.com/in/amjadlle](https://linkedin.com/in/amjadlle)
* Buy Me a Coffee: [buymeacoffee.com/amjadlle](https://buymeacoffee.com/amjadlle)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

