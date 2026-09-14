import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";
import { getDb, initDb } from "@/lib/db";

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
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    await initDb();
    const db = getDb();

    const bot_title = (body.bot_title || customer.bot_title || "ZeroRoute AI").trim();
    const bot_role = (body.bot_role || customer.bot_role || "AI Assistant").trim();
    const tone = (body.tone || customer.tone || "helpful and concise").trim();
    const greeting = (body.greeting || customer.greeting || "Hi there! How can I help you today?").trim();
    const prompts = Array.isArray(body.prompts) ? JSON.stringify(body.prompts) : (body.prompts || customer.prompts || "[]");
    const persona = (body.persona ?? customer.persona ?? "").trim();
    const now = Date.now();

    await db.execute({
      sql: `
        UPDATE customers SET
          bot_title = ?,
          bot_role = ?,
          tone = ?,
          greeting = ?,
          prompts = ?,
          persona = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [bot_title, bot_role, tone, greeting, prompts, persona, now, customer.id],
    });

    return NextResponse.json({
      success: true,
      message: "Persona settings updated successfully!",
    });
  } catch (err: unknown) {
    console.error("Persona update error:", err);
    return NextResponse.json({ error: "Failed to update persona settings." }, { status: 500 });
  }
}

export const PUT = POST;

