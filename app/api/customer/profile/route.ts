import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";
import { getDb, initDb } from "@/lib/db";

export async function GET(req: NextRequest) {
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
      const urlKey = req.nextUrl.searchParams.get("key") || req.nextUrl.searchParams.get("token");
      if (urlKey) {
        customer = await getCustomerByTokenOrKey(urlKey);
      }
    }

    if (!customer) {
      const urlKey = req.nextUrl.searchParams.get("key") || req.nextUrl.searchParams.get("token");
      if (urlKey) {
        customer = await getCustomerByTokenOrKey(urlKey);
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    await initDb();
    const db = getDb();

    // Fetch knowledge doc count
    const docsResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM knowledge_documents WHERE customer_key = ?",
      args: [customer.key],
    });

    const docCount = Number((docsResult.rows[0] as any)?.count || 0);

    // Calculate days remaining
    const now = Date.now();
    const expiresAt = Number(customer.subscription_expires || 0);
    const daysRemaining = expiresAt > now ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        key: customer.key,
        email: customer.email,
        name: customer.name || "Subscriber",
        company: customer.company || "",
        website: customer.website || "",
        bot_title: customer.bot_title || "ZeroRoute AI",
        bot_role: customer.bot_role || "AI Assistant",
        tone: customer.tone || "helpful and concise",
        greeting: customer.greeting || "Hi there! How can I help you today?",
        prompts: customer.prompts ? JSON.parse(customer.prompts) : [],
        persona: customer.persona || "",
        status: customer.status || "active",
        subscription_expires: customer.subscription_expires,
        days_remaining: daysRemaining,
        monthly_requests: customer.monthly_requests || 0,
        monthly_limit: customer.monthly_limit || 2000,
        bot_id: customer.bot_id || "",
        knowledge_docs_count: docCount,
        created_at: customer.created_at,
      },
    });
  } catch (err: unknown) {
    console.error("Customer profile error:", err);
    return NextResponse.json({ error: "Failed to fetch customer profile." }, { status: 500 });
  }
}
