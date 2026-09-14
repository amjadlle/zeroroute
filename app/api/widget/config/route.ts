import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const botId = url.searchParams.get("bot_id") || url.searchParams.get("id");

  if (!botId) {
    return NextResponse.json({ error: "bot_id query parameter is required" }, { status: 400 });
  }

  try {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT bot_title, bot_role, tone, greeting, prompts, company, name, status FROM customers WHERE bot_id = ? LIMIT 1`,
      args: [botId]
    });

    const row = res.rows[0] as any;
    if (!row) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    let prompts = [];
    try {
      if (row.prompts) prompts = JSON.parse(row.prompts);
    } catch {}

    return NextResponse.json({
      success: true,
      bot: {
        botTitle: row.bot_title || "ZeroRoute AI",
        botRole: row.bot_role || "Assistant",
        greeting: row.greeting || "Hi there! How can I help you today?",
        prompts: prompts.length > 0 ? prompts : ["Tell me about your services", "How much does it cost?", "Can I talk to support?"],
        company: row.company || "ZeroRoute",
        status: row.status
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60, s-maxage=120"
      }
    });
  } catch (err) {
    console.error("[WidgetConfig Error]:", err);
    return NextResponse.json({ error: "Failed to fetch bot configuration" }, { status: 500 });
  }
}
