import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, initDb } from "@/lib/db";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";
import { crawlSourceUrl } from "@/lib/crawler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let customer = await getCurrentUser();

    if (!customer) {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
      if (token) {
        customer = await getCustomerByTokenOrKey(token);
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const rawUrl = (body.url || "").trim();
    const customTitle = body.title ? body.title.trim() : undefined;

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

    const docId = `doc_crawl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = Date.now();

    await db.execute({
      sql: `
        INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, source_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        docId,
        customer.key,
        crawlResult.title,
        `web_${crawlResult.sourceType}`,
        crawlResult.content,
        crawlResult.charCount,
        crawlResult.normalizedUrl,
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Web page crawled and indexed into knowledge base successfully!",
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
