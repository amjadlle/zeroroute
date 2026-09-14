# ZeroRoute SaaS - Production Deployment Guide

ZeroRoute is built on **Next.js 16 (App Router + TypeScript + Tailwind CSS)** and supports dual database backends:
- **Local / VPS / Node.js**: Embedded SQLite via `@libsql/client` (stored in `data/zeroroute.db`).
- **Edge / Cloudflare**: Cloudflare D1 Serverless Database with 0ms cold starts.

---

## 1. Environment Variables Configuration

Copy `.env.example` to `.env.local` or set these in your production hosting platform:

```bash
# App Configuration
APP_URL=https://zeroroute.mapki.in
NODE_ENV=production

# Admin Access Credentials
ADMIN_EMAIL=admin@zeroroute.io
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_KEY=zr_admin_master_secret_key
ROUTER_API_KEY=zr_admin_master_secret_key

# Dodo Payments Integration
DODO_ENVIRONMENT=live_mode # or test_mode
DODO_API_KEY=your_dodo_api_key
DODO_PRODUCT_ID=pdt_0Nml3W2yZao32si4mSs6b
DODO_WEBHOOK_SECRET=whsec_your_webhook_secret_key

# Transactional Email (Optional - falls back to secure stdout logging)
RESEND_API_KEY=re_your_resend_key
EMAIL_FROM="ZeroRoute <notifications@zeroroute.io>"

# Free AI Cloud Provider API Keys (Fallback Matrix)
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=csk-...
SAMBANOVA_API_KEY=...
MISTRAL_API_KEY=...
GEMINI_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
NVIDIA_NIM_API_KEY=nvapi-...
HUGGINGFACE_API_KEY=hf_...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

---

## 2. Deployment Options

### Option A: Standard Node.js / Docker / VPS / PM2
```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Start server on port 3000
npm run start
```

### Option B: Cloudflare Pages / OpenNext
1. Create a Cloudflare D1 database:
   ```bash
   npx wrangler d1 create zeroroute-production
   ```
2. Run database migration:
   ```bash
   npx wrangler d1 execute zeroroute-production --file=./scripts/schema.sql
   ```
3. Deploy:
   ```bash
   npx @opennextjs/cloudflare
   ```

### Option C: Vercel 1-Click Deploy
1. Push repository to GitHub.
2. Import project into Vercel.
3. Configure environment variables in Vercel Project Settings.
4. Deploy!

---

## 3. Webhook Setup in Dodo Payments Dashboard
1. Go to **Dodo Payments Dashboard > Developers > Webhooks**.
2. Add Endpoint: `https://your-domain.com/api/webhooks/dodo`.
3. Select events:
   - `payment.succeeded`
   - `subscription.active`
   - `subscription.renewed`
   - `subscription.cancelled`
   - `subscription.failed`
4. Copy the Webhook Secret (`whsec_...`) and set as `DODO_WEBHOOK_SECRET`.
