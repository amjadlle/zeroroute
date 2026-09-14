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
  src="https://your-domain.com/widget.js" 
  data-title="ZeroRoute AI" 
  data-greeting="Hi! How can I help you?"
  data-color="#ef4444"
  defer>
</script>
```

Optional widget attributes:
- `data-persona="You are a helpful support agent."` (Inline prompt)
- `data-persona-url="https://site.com/persona.md"` (Remote prompt file)
- `data-knowledge="Hours: 9am-5pm. Email: contact@site.com"` (Inline facts)
- `data-knowledge-url="https://site.com/knowledge.md"` (Remote knowledge file)
- `data-key="your-router-key"` (If authentication is required)

## Deployment Options
- **Cloudflare Pages**: 1-click Edge deployment (`functions/[[path]].ts` + `public/`) with 100k free requests/day (no credit card required).
- **Vercel**: 1-click Serverless edge deployment (`api/index.ts` + `vercel.json`).
- **Render**: 1-click Web Service deployment (`render.yaml`).
- **Docker / VPS**: `docker compose up -d` or `docker build -t zeroroute .` (AWS EC2, Azure VM, Oracle Cloud).
- **Local Node.js**: `npm run build && npm start` (port 8787).

## Links
- **GitHub**: https://github.com/amjadlle/zeroroute
- **Documentation**: https://github.com/amjadlle/zeroroute/blob/main/docs/ARCHITECTURE.md
- **License**: MIT License
