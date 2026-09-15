import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, initDb } from "@/lib/db";
import { getCurrentUser, getCustomerByTokenOrKey, resolveAuth } from "@/lib/auth/session";
import { crawlSourceUrl } from "@/lib/crawler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let customer = await getCurrentUser();
    const authHeader = req.headers.get("authorization") || "";
    const auth = await resolveAuth(authHeader);

    if (!customer && auth.customer) {
      customer = auth.customer;
    }

    if (!customer && !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const isAdmin = auth.isAdmin || customer?.id === "admin_master";
    const body = await req.json();
    const rawUrl = (body.url || "").trim();
    const customTitle = body.title ? body.title.trim() : undefined;

    let targetKey = customer?.key || "zr_admin_master";
    if (isAdmin) {
      if (body.target_key) {
        targetKey = body.target_key;
      } else if (body.bot_id) {
        await initDb();
        const db = getDb();
        const res = await db.execute({
          sql: "SELECT key FROM customers WHERE bot_id = ? LIMIT 1",
          args: [body.bot_id],
        });
        if (res.rows.length > 0) {
          targetKey = (res.rows[0] as any).key;
        }
      }
    }

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required for crawling." }, { status: 400 });
    }

    // Crawl and parse URL
    let crawlResult;
    try {
      crawlResult = await crawlSourceUrl(rawUrl, customTitle);
    } catch (crawlErr: any) {
      return NextResponse.json(
        { error: crawlErr.message || "Failed to crawl URL. Ensure the page is publicly accessible." },
        { status: 422 }
      );
    }

    await initDb();
    const db = getDb();
    const now = Date.now();

    // Check if a document with this source_url already exists for this bot/customer
    const existing = await db.execute({
      sql: `SELECT id FROM knowledge_documents WHERE customer_key = ? AND source_url = ? LIMIT 1`,
      args: [targetKey, crawlResult.normalizedUrl],
    });

    let docId: string;
    if (existing.rows && existing.rows.length > 0) {
      docId = (existing.rows[0] as any).id;
      await db.execute({
        sql: `
          UPDATE knowledge_documents 
          SET title = ?, type = ?, content = ?, char_count = ?, created_at = ?
          WHERE id = ?
        `,
        args: [
          crawlResult.title,
          `web_${crawlResult.sourceType}`,
          crawlResult.content,
          crawlResult.charCount,
          now,
          docId,
        ],
      });
    } else {
      docId = `doc_crawl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      await db.execute({
        sql: `
          INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, source_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          docId,
          targetKey,
          crawlResult.title,
          `web_${crawlResult.sourceType}`,
          crawlResult.content,
          crawlResult.charCount,
          crawlResult.normalizedUrl,
          now,
        ],
      });
    }

    try {
      const { invalidateDocCache } = await import("@/lib/providers/rag");
      invalidateDocCache(targetKey);
    } catch {}

    return NextResponse.json({
      success: true,
      message: existing.rows?.length ? "Knowledge source re-synced and updated successfully!" : "Web page crawled and indexed into knowledge base successfully!",
      document: {
        id: docId,
        title: crawlResult.title,
        type: `web_${crawlResult.sourceType}`,
        char_count: crawlResult.charCount,
        source_url: crawlResult.normalizedUrl,
        created_at: now,
      },
    });
  } catch (err: unknown) {
    console.error("Knowledge crawl route error:", err);
    return NextResponse.json({ error: "Failed to process crawl request." }, { status: 500 });
  }
}
