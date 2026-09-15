import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";
import { generateSalt, hashPassword } from "@/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await initDb();
    const db = getDb();

    // 1. Identify user via session, customer key, or email
    let customer = await getCurrentUser();
    const token = body.key || body.token;

    if (!customer && token && !token.includes("demo")) {
      customer = await getCustomerByTokenOrKey(token);
    }

    if (!customer && body.email) {
      const email = body.email.trim().toLowerCase();
      const res = await db.execute({
        sql: `SELECT * FROM customers WHERE email = ? LIMIT 1`,
        args: [email]
      });
      if (res.rows.length > 0) {
        customer = res.rows[0] as any;
      }
    }

    // If still not authenticated and no valid registration email provided, reject unauthorized
    if (!customer && (!body.email || !body.email.includes("@"))) {
      return NextResponse.json({ error: "Unauthorized. Please log in or provide a valid registration email." }, { status: 401 });
    }

    // Fallback: If database has no customer at all, create one on the fly
    if (!customer) {
      const crypto = await import("crypto");
      const id = crypto.randomUUID();
      const key = `zr_live_${crypto.randomBytes(18).toString("hex")}`;
      const botId = `bot_${crypto.randomBytes(8).toString("hex")}`;
      const sessionToken = `zr_sess_${crypto.randomBytes(24).toString("hex")}`;
      const now = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
      const defaultEmail = body.email || "subscriber@example.com";
      const defaultCompany = body.company || "My Application";

      await db.execute({
        sql: `INSERT INTO customers (
          id, key, email, name, company, bot_id, status,
          subscription_expires, monthly_requests, monthly_limit,
          session_token, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 0, 10000, ?, ?, ?)`,
        args: [
          id,
          key,
          defaultEmail,
          "Subscriber",
          defaultCompany,
          botId,
          expiresAt,
          sessionToken,
          now,
          now,
        ],
      });

      customer = {
        id,
        key,
        email: defaultEmail,
        name: "Subscriber",
        company: defaultCompany,
        bot_id: botId,
        status: "active",
        session_token: sessionToken,
        monthly_requests: 0,
        monthly_limit: 10000,
        created_at: now,
        updated_at: now,
      } as any;
    }

    const activeCust: any = customer;

    const name = body.name ? body.name.trim() : activeCust.name;
    const company = body.company ? body.company.trim() : activeCust.company;
    const website = body.website ? body.website.trim() : activeCust.website;
    const bot_title = body.botTitle || body.bot_title ? (body.botTitle || body.bot_title).trim() : activeCust.bot_title || "ZeroRoute AI";
    const bot_role = body.botRole || body.bot_role ? (body.botRole || body.bot_role).trim() : activeCust.bot_role || "AI Assistant";
    const tone = body.tone ? body.tone.trim() : activeCust.tone || "helpful and concise";
    const greeting = body.greeting ? body.greeting.trim() : activeCust.greeting || "Hi there! How can I help you today?";
    const prompts = Array.isArray(body.prompts) ? JSON.stringify(body.prompts) : (body.prompts || activeCust.prompts || "[]");
    const persona = body.persona ? body.persona.trim() : activeCust.persona;

    const now = Date.now();

    // Update password if provided
    let passwordHash = activeCust.password_hash;
    let passwordSalt = activeCust.password_salt;

    if (body.password && body.password.length >= 6) {
      passwordSalt = generateSalt();
      passwordHash = hashPassword(body.password, passwordSalt);
    }

    const sessionToken = activeCust.session_token || `zr_sess_${(await import("crypto")).randomBytes(24).toString("hex")}`;

    await db.execute({
      sql: `
        UPDATE customers SET
          name = ?,
          company = ?,
          website = ?,
          bot_title = ?,
          bot_role = ?,
          tone = ?,
          greeting = ?,
          prompts = ?,
          persona = ?,
          password_hash = ?,
          password_salt = ?,
          session_token = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        name,
        company,
        website,
        bot_title,
        bot_role,
        tone,
        greeting,
        prompts,
        persona,
        passwordHash,
        passwordSalt,
        sessionToken,
        now,
        activeCust.id,
      ],
    });

    // Save initial knowledge text if provided
    const knowledgeContent = body.knowledgeText || body.knowledge_text;
    const knowledgeTitle = body.knowledgeTitle || body.knowledge_title || "Initial Onboarding Knowledge";

    if (knowledgeContent && knowledgeContent.trim().length > 10) {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const content = knowledgeContent.trim();
      await db.execute({
        sql: `
          INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, created_at)
          VALUES (?, ?, ?, 'manual_text', ?, ?, ?)
        `,
        args: [
          docId,
          activeCust.key,
          knowledgeTitle,
          content,
          content.length,
          now,
        ],
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Onboarding completed successfully!",
      token: sessionToken,
      customer: {
        id: activeCust.id,
        key: activeCust.key,
        email: activeCust.email,
        name,
        company,
        bot_title,
        bot_id: activeCust.bot_id,
        status: activeCust.status,
      },
    });

    // Set authenticated session cookie
    response.cookies.set({
      name: "zr_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set({
      name: "zr_role",
      value: "customer",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Onboarding setup error:", err);
    return NextResponse.json(
      { error: "Failed to save onboarding configuration." },
      { status: 500 }
    );
  }
}
