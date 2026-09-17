import { getDb } from "../db";
import fs from "fs";
import path from "path";

let defaultKnowledgeCache: string | null = null;
let defaultPersonaCache: string | null = null;

export function getDefaultLandingKnowledge(): { knowledge: string; persona: string } {
  if (defaultKnowledgeCache === null) {
    try {
      const p = path.join(process.cwd(), "public", "knowledge.md");
      if (fs.existsSync(p)) {
        defaultKnowledgeCache = fs.readFileSync(p, "utf-8");
      }
    } catch {}
    if (!defaultKnowledgeCache) {
      defaultKnowledgeCache = `# ZeroRoute Knowledge Base\nZeroRoute is an open-source multi-cloud AI gateway that aggregates quotas from 11 cloud providers into one OpenAI-compatible endpoint with intelligent dynamic routing and an embeddable 1-line website chatbot.`;
    }
  }

  if (defaultPersonaCache === null) {
    try {
      const p = path.join(process.cwd(), "public", "persona.md");
      if (fs.existsSync(p)) {
        defaultPersonaCache = fs.readFileSync(p, "utf-8");
      }
    } catch {}
    if (!defaultPersonaCache) {
      defaultPersonaCache = `You are the official AI assistant for ZeroRoute. Be concise, direct, helpful, and friendly.`;
    }
  }

  return { knowledge: defaultKnowledgeCache, persona: defaultPersonaCache };
}

export interface SystemPromptOptions {
  companyName?: string | null;
  botTitle?: string | null;
  botRole?: string | null;
  tone?: string | null;
  greeting?: string | null;
  prompts?: string[] | null;
  customPersona?: string | null;
  knowledgeContext?: string | null;
}

export function buildDynamicSystemPrompt(options: SystemPromptOptions): string {
  const company = options.companyName || "Our Company";
  const title = options.botTitle || `${company} AI Assistant`;
  const role = options.botRole || "AI Customer Solutions Specialist";
  const tone = options.tone || "helpful, friendly, concise, and structured";

  const sections: string[] = [];

  // Core Identity & Mission
  sections.push(
    `You are ${title}, an expert ${role} representing ${company}.\nYour communication tone is ${tone}. Your mission is to provide accurate, compelling, beautifully structured, and high-value answers that help visitors succeed.`
  );

  // Custom Persona / Directives
  if (options.customPersona && options.customPersona.trim()) {
    sections.push(`### Brand Guidelines & Persona:\n${options.customPersona.trim()}`);
  }

  // Knowledge Base RAG Context
  if (options.knowledgeContext && options.knowledgeContext.trim()) {
    sections.push(
      `### Verified Knowledge Base:\nUse the following verified business information to accurately answer customer queries. Base your answers firmly on these details:\n\n${options.knowledgeContext.trim()}`
    );
  }

  // Response Style & Formatting Directives
  sections.push(
    `### Response Formatting Guidelines:
- **Temporal Grounding (Current Year: 2026)**: Never assume, fabricate, or append outdated years (such as "(2024)", "(2023)", or past dates) to schedules, programs, or headings unless explicitly written in the verified knowledge base. Treat all business schedules as active and ongoing.
- **Concise & Chat-Optimized (CRITICAL)**: Keep responses short, punchy, and conversational (ideally 2-3 brief paragraphs or 3-5 bullet points, under 120 words). Never dump long essays or overwhelming walls of text.
- **Clean Chat Formatting**: Do NOT output raw Markdown heading hashes (\`#\`, \`##\`, \`###\`). Instead, use bold text (\`**Section Title**\`) for section headings to ensure clean chat bubbles.
- **Strict Knowledge Fidelity**: Only state facts, locations, hours, and schedules that exist in the verified knowledge base. Never invent details, numbers, or unstated terms.
- **Never Fabricate Numbers, Tiers, or Pricing**: If specific dollar amounts or pricing tiers are not in your verified knowledge base, DO NOT invent fake prices (e.g. do not invent "$999/mo" or "$1,999/mo"). Instead, explain clearly that pricing is customized based on project scope.
- **Zero Hallucinated Placeholders or URLs**: NEVER output bracketed placeholders like \`[Your Number]\` or fabricated URLs like \`calendly.com/...\` or \`/growth-audit\`. Only reference official contact points from the knowledge base.
- **Focused & Interactive**: Answer the user's specific question directly, then guide the conversation forward with one targeted follow-up question.`
  );

  return sections.join("\n\n");
}

interface DocCacheEntry {
  docs: any[];
  expiresAt: number;
}
const docCache = new Map<string, DocCacheEntry>();

export function invalidateDocCache(customerKey?: string) {
  if (customerKey) docCache.delete(customerKey);
  else docCache.clear();
}

export async function retrieveKnowledgeContext(
  customerKey: string,
  userQuery: string,
  maxChars = 2500
): Promise<string> {
  if (!customerKey || !userQuery || !userQuery.trim()) return "";

  try {
    let rows: any[] = [];
    const cached = docCache.get(customerKey);
    if (cached && Date.now() < cached.expiresAt) {
      rows = cached.docs;
    } else {
      const db = getDb();
      const result = await db.execute({
        sql: `SELECT title, content, type FROM knowledge_documents WHERE customer_key = ? ORDER BY created_at DESC LIMIT 50`,
        args: [customerKey]
      });
      rows = result.rows || [];
      docCache.set(customerKey, { docs: rows, expiresAt: Date.now() + 60_000 });
    }

    if (!rows || rows.length === 0) return "";

    const cleanTokens = userQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 2);

    const scoredDocs = rows.map((row: any) => {
      const content = String(row.content || "");
      const title = String(row.title || "");
      const lowerText = (title + " " + content).toLowerCase();

      let score = 0;
      for (const token of cleanTokens) {
        if (title.toLowerCase().includes(token)) score += 5;
        const matches = lowerText.split(token).length - 1;
        score += matches;
      }

      return {
        title,
        content,
        score
      };
    });

    scoredDocs.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    let collectedText = "";
    for (const doc of scoredDocs) {
      if (collectedText.length >= maxChars) break;
      const snippet = `[Document: ${doc.title}]\n${doc.content}\n\n`;
      if ((collectedText + snippet).length <= maxChars) {
        collectedText += snippet;
      } else {
        const remaining = maxChars - collectedText.length;
        if (remaining > 100) {
          collectedText += `[Document: ${doc.title}]\n${doc.content.slice(0, remaining)}...\n\n`;
        }
        break;
      }
    }

    return collectedText.trim();
  } catch (err) {
    console.error("[RAG Retrieval Error]:", err);
    return "";
  }
}
