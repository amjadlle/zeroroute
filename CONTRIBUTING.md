# Contributing to ZeroRoute

Thank you for your interest in contributing to ZeroRoute! We welcome contributions from developers worldwide to make multi-cloud AI routing and autonomous customer support chatbots more resilient, cost-effective, and open.

---

## 🛠️ Development Workflow

1. **Fork the repository** on GitHub.
2. **Clone your fork locally**:
   `ash
   git clone https://github.com/your-username/zeroroute.git
   cd zeroroute
   `
3. **Install dependencies**:
   `ash
   npm install
   `
4. **Copy the environment template**:
   `ash
   cp .env.example .env.local
   `
5. **Run the local dev server**:
   `ash
   npm run dev
   `

---

## 🧪 Testing & Code Style

- Verify that your code passes full Next.js production compilation with zero errors:
  `ash
  npm run build
  `
- Follow TypeScript strict typing and ESLint rules.
- Maintain edge compatibility: All route handlers must support serverless and edge environments.

---

## 📬 Submitting Pull Requests

1. Create a feature branch:
   `ash
   git checkout -b feat/my-new-feature
   `
2. Commit your changes with conventional commit messages:
   `ash
   git commit -m "feat: add support for new provider X"
   `
3. Push to your fork:
   `ash
   git push origin feat/my-new-feature
   `
4. Open a Pull Request against the main branch of mjadlle/zeroroute.

---

## 📜 Code of Conduct

Please treat all community members with kindness, respect, and constructive collaboration.
