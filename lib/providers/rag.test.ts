import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { testDb } from "@/tests/db";
import { buildDynamicSystemPrompt, expandQuery, getDefaultLandingKnowledge, invalidateDocCache, retrieveKnowledgeContext, stem } from "./rag";

const headings = (prompt: string) => prompt.split("\n").filter((l) => l.startsWith("# "));

describe("buildDynamicSystemPrompt", () => {
  const full = buildDynamicSystemPrompt({
    companyName: "Acme",
    botTitle: "AcmeBot",
    botRole: "Support Lead",
    tone: "warm",
    customPersona: "  Speak like a pirate.  ",
    knowledgeContext: "  [Document: Hours]\nOpen 9-5.  ",
  });

  it("keeps the block order stable", () => {
    expect(headings(full)).toMatchInlineSnapshot(`
      [
        "# Identity",
        "# Core Mission",
        "# Brand Voice & Persona",
        "# Verified Knowledge Base",
        "# The Golden Rules — Read Every Rule. Follow All of Them. No Exceptions.",
        "# Interaction Style",
        "# RULE 8 — Primary Language: English (Default)",
        "# RULE 9 — Conversation Consistency",
        "# RULE 10 — Human Escalation Protocol",
        "# RULE 11 — Adaptive Response Length",
      ]
    `);
  });

  it("fills identity, persona and trimmed knowledge", () => {
    expect(full).toContain("You are **AcmeBot**, the official AI assistant for **Acme**.\nYour role is **Support Lead**.\nYour tone is: warm.");
    expect(full).toContain("# Brand Voice & Persona\nSpeak like a pirate.\n");
    expect(full).toContain("---\n\n[Document: Hours]\nOpen 9-5.\n\n---");
    expect(full).toContain("You MUST answer questions **only** using information");
  });

  it("uses defaults and the no-knowledge rule when options are empty", () => {
    const p = buildDynamicSystemPrompt({ companyName: null, knowledgeContext: "   ", customPersona: "" });
    expect(headings(p)).not.toContain("# Verified Knowledge Base");
    expect(headings(p)).not.toContain("# Brand Voice & Persona");
    expect(p).toContain("You are **Our Company AI Assistant**, the official AI assistant for **Our Company**.");
    expect(p).toContain("Your role is **AI Customer Solutions Specialist**.");
    expect(p).toContain("No knowledge base has been loaded yet.");
    expect(p).not.toMatch(/undefined|null/);
  });
});

describe("getDefaultLandingKnowledge", () => {
  it("returns non-empty knowledge and persona", () => {
    const { knowledge, persona } = getDefaultLandingKnowledge();
    expect(knowledge.trim().length).toBeGreaterThan(0);
    expect(persona.trim().length).toBeGreaterThan(0);
  });
});

describe("retrieveKnowledgeContext", () => {
  let db: Awaited<ReturnType<typeof testDb>>;
  let seq = 0;
  const add = (customerKey: string, title: string, content: string, type = "manual_text") =>
    db.execute({
      sql: "INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [`doc_${++seq}`, customerKey, title, type, content, content.length, seq],
    });
  const docTitles = (ctx: string) => [...ctx.matchAll(/\[Document: (.+?)\]/g)].map((m) => m[1]);

  beforeAll(async () => {
    db = await testDb();
    await add("k1", "Opening Hours", "We are open Monday to Friday, 9am to 5pm. Closed on public holidays.");
    await add("k1", "Pricing Plans", "The Pro plan costs $20 per month. The Team plan costs $50 per month.", "pricing");
    await add("k1", "Refund Policy", "Refunds are available within 14 days of purchase.", "policy");
    await add("k1", "Shipping FAQ", "Q: How long does shipping take? A: Shipping takes 3-5 business days.", "faq");
    await add("k1", "About Us", "Acme was founded in 2010 by two engineers.");
    await add("k2", "Other tenant", "Secret pricing for another customer: $1 per month.");
  });
  beforeEach(() => invalidateDocCache());

  it("ranks the best-matching document first and leaves unrelated ones out", async () => {
    const ctx = await retrieveKnowledgeContext("k1", "What are your opening hours?");
    expect(docTitles(ctx)[0]).toBe("Opening Hours");
    expect(docTitles(ctx)).not.toContain("About Us");
  });

  it("expands synonyms (cost -> pricing) and only reads the caller's documents", async () => {
    const ctx = await retrieveKnowledgeContext("k1", "how much does it cost");
    expect(docTitles(ctx)[0]).toBe("Pricing Plans");
    expect(ctx).not.toContain("another customer");
  });

  it("boosts FAQ documents and phrase (bigram) matches", async () => {
    const ctx = await retrieveKnowledgeContext("k1", "shipping take");
    expect(docTitles(ctx)[0]).toBe("Shipping FAQ");
  });

  it("returns empty for blank, stop-word-only or unmatched queries and unknown customers", async () => {
    expect(await retrieveKnowledgeContext("k1", "   ")).toBe("");
    expect(await retrieveKnowledgeContext("k1", "is it the")).toBe("");
    expect(await retrieveKnowledgeContext("k2", "zzzz qqqq")).toBe("");
    expect(await retrieveKnowledgeContext("nobody", "pricing")).toBe("");
    expect(await retrieveKnowledgeContext("", "pricing")).toBe("");
  });

  it("does not inject FAQ/policy documents for an unrelated query", async () => {
    expect(await retrieveKnowledgeContext("k1", "zzzz qqqq")).toBe("");
  });

  it("respects maxChars and trims a partial document", async () => {
    const ctx = await retrieveKnowledgeContext("k1", "refund pricing hours shipping", 200);
    expect(ctx.length).toBeLessThanOrEqual(200);
    expect(ctx).toMatch(/^\[Document: /);
  });

  it("serves documents from a 5-minute cache until invalidated", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      // k3 holds only untyped documents, so nothing matches before the warranty doc exists.
      await add("k3", "About", "Acme sells widgets.");
      expect(await retrieveKnowledgeContext("k3", "warranty")).toBe("");
      await add("k3", "Warranty", "Every product has a two year warranty.");
      expect(await retrieveKnowledgeContext("k3", "warranty")).toBe(""); // cached list
      vi.advanceTimersByTime(300_001);
      expect(docTitles(await retrieveKnowledgeContext("k3", "warranty"))).toEqual(["Warranty"]);
      await db.execute("DELETE FROM knowledge_documents WHERE title = 'Warranty'");
      invalidateDocCache("k3");
      expect(await retrieveKnowledgeContext("k3", "warranty")).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("stem (#38)", () => {
  it.each([
    ["classes", "class"],
    ["policies", "polici"],
    ["glass", "glass"],
    ["Prices", "price"],
    ["agreed", "agree"],
    ["shipping", "shipp"],
    ["booked", "book"],
    ["relational", "relate"],
    ["happiness", "happiness"], // "ss" returns first, so the -ness rule never fires
    ["careful", "care"],
    ["payment", "pay"],
    ["quickly", "quick"],
    ["cat", "cat"],
  ])("%s -> %s", (word, expected) => {
    expect(stem(word)).toBe(expected);
  });
});

describe("expandQuery (#38)", () => {
  it("adds synonyms and stems, keeping the original tokens", () => {
    const out = expandQuery(["price", "plans"]);
    expect(out).toEqual(expect.arrayContaining(["price", "plans", "cost", "plan"]));
  });

  it("drops one-letter terms", () => {
    expect(expandQuery(["a", "xyz"])).toEqual(["xyz"]);
  });
});
