import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";
import { getDb, initDb } from "@/lib/db";
import { parseAppearance } from "@/lib/brand";

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

    const bot_title = (body.bot_title ? String(body.bot_title).trim() : customer.bot_title || "ZeroRoute AI").slice(0, 100);
    const bot_role = (body.bot_role ? String(body.bot_role).trim() : customer.bot_role || "AI Assistant").slice(0, 100);
    const tone = (body.tone ? String(body.tone).trim() : customer.tone || "helpful and concise").slice(0, 100);
    const greeting = (body.greeting ? String(body.greeting).trim() : customer.greeting || "Hi there! How can I help you today?").slice(0, 500);
    const prompts = Array.isArray(body.prompts) ? JSON.stringify(body.prompts.slice(0, 10).map((p: unknown) => String(p).slice(0, 200))) : (typeof body.prompts === "string" ? body.prompts.slice(0, 2000) : customer.prompts || "[]");
    const persona = (body.persona !== undefined ? String(body.persona).trim() : customer.persona || "").slice(0, 10000);
    // Appearance: omitted keeps the stored value, empty clears it, anything else must validate.
    const appearance: Record<"brand_color" | "logo_url", string | null> = {
      brand_color: customer.brand_color ?? null,
      logo_url: customer.logo_url ?? null,
    };
    for (const field of ["brand_color", "logo_url"] as const) {
      if (body[field] === undefined) continue;
      const parsed = parseAppearance(field, body[field]);
      if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
      appearance[field] = parsed.value;
    }
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
          brand_color = ?,
          logo_url = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [bot_title, bot_role, tone, greeting, prompts, persona, appearance.brand_color, appearance.logo_url, now, customer.id],
    });

    const { invalidateSessionCache, invalidateCustomerLookupCache } = await import("@/lib/auth/session");
    if (customer.session_token) invalidateSessionCache(customer.session_token);
    if (customer.key) {
      invalidateCustomerLookupCache(customer.key);
      invalidateSessionCache(`key:${customer.key}`); // bearer lookups cache under this prefix
    }

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

