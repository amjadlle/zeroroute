# ZeroRoute — Verified Knowledge Base

## Product Overview
ZeroRoute is an open-source multi-cloud AI gateway that pools API quotas from 11 top cloud providers into one OpenAI-compatible endpoint with intelligent real-time dynamic routing and an embeddable 1-line website chatbot. Subscribers receive 10,000 monthly requests with high-availability multi-cloud inference.

## Core Capabilities
- **Intelligent Dynamic Routing**: Sub-8ms load balancing dynamically dispatches requests to the healthiest, fastest available AI cloud.
- **In-Memory RAM Cache**: SHA-256 keyed cache serves identical prompts in 0ms with zero API token consumption.
- **Self-Healing Heartbeat**: Continuous health probes maintain provider availability matrices.
- **Zero Runtime Dependencies**: Native Node.js HTTP and Fetch.
- **Encrypted Keys**: AES-256-GCM encrypted key storage for provider API keys.
- **Wildcard Subdomain CORS**: `CORS_ORIGIN=*.yourdomain.com` allows all subdomains.

## Supported Cloud Providers & Free Tiers
1. **Groq**: ~100ms ultra-fast inference (`openai/gpt-oss-20b`)
2. **Cerebras**: ~80ms wafer-scale high speed inference (`llama3.1-8b`)
3. **SambaNova**: ~360ms high throughput (`gemma-4-31B-it`)
4. **Mistral AI**: ~390ms European privacy & reasoning (`mistral-small-latest`)
5. **Google Gemini**: ~710ms 1M+ token context (`gemini-flash-lite-latest`)
6. **NVIDIA NIM**: ~260ms DGX cloud infrastructure (`nvidia/nemotron-3.5-lightning-30b-a3b`)
7. **OpenRouter**: Free open-source model pool (`nvidia/nemotron-3.5-lightning:free`)
8. **Cloudflare Workers AI**: Global edge inference (`@cf/meta/llama-3.1-8b-instruct`)
9. **Cohere**: Conversational reasoning (`command-r-plus-08-2024`)
10. **Hugging Face**: Serverless open-source router
11. **BazaarLink**: Distributed inference pool

## How to Embed the Chatbot Widget
Add a single script tag before `</body>`:
```html
<script 
  src="https://zeroroute.mapki.in/widget.js" 
  data-title="ZeroRoute AI" 
  data-greeting="Hi! How can I help you?"
  data-color="#ef4444"
  defer>
</script>
```

## Deployment & Hosting
- **Vercel**: Native Next.js 16 Serverless edge deployment (`https://zeroroute.mapki.in`).
- **Docker / VPS**: `docker compose up -d` or `docker build -t zeroroute .` (AWS, Azure, DigitalOcean).
- **Local Development**: `npm run dev` or `npm run build && npm start`.

## Links
- **Official SaaS**: https://zeroroute.mapki.in
- **GitHub Repository**: https://github.com/amjadlle/zeroroute
- **License**: MIT License
