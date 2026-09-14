# ZeroRoute — Verified Knowledge Base

## Product Overview
ZeroRoute is an open-source, $0/mo multi-cloud AI gateway that aggregates free-tier API quotas from 8 cloud providers into one OpenAI-compatible endpoint with automatic failover and an embeddable 1-line website chatbot.

## Core Capabilities
- **Automatic Failover**: Instantly re-routes to the next provider on 429, 500, or timeout.
- **In-Memory RAM Cache**: SHA-256 keyed cache serves identical prompts in 0ms with zero API token consumption.
- **Self-Healing Heartbeat**: Background probe checks cooling providers every 30s and restores them to traffic.
- **Zero Runtime Dependencies**: Native Node.js HTTP and Fetch.
- **Encrypted Keys**: AES-256-GCM encrypted key storage for provider API keys.
- **Wildcard Subdomain CORS**: `CORS_ORIGIN=*.yourdomain.com` allows all subdomains.

## Supported Cloud Providers & Free Tiers
1. **Groq**: ~100ms ultra-fast inference (`openai/gpt-oss-20b`)
2. **SambaNova**: ~360ms high throughput (`gemma-4-31B-it`)
3. **Mistral AI**: ~390ms European privacy & reasoning (`mistral-small-latest`)
4. **Google Gemini**: ~710ms 1M+ token context (`gemini-3.6-flash`)
5. **NVIDIA NIM**: ~260ms DGX cloud infrastructure (`nvidia/nemotron-3.5-lightning-30b-a3b`)
6. **OpenRouter**: Free open-source model pool (`nvidia/nemotron-3.5-lightning:free`)
7. **Cloudflare Workers AI**: Global edge inference (`@cf/meta/llama-3.1-8b-instruct`)
8. **Cohere**: Conversational reasoning (`command-r-plus-08-2024`)

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
