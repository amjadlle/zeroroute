import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";
import { generateSalt, hashPassword } from "@/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await initDb();
    const db = getDb();

    // 1. Identify user via authenticated session or verified customer key/token
    let customer = await getCurrentUser();
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const token = body.key || body.token || bearerToken;

    if (!customer && token && !token.includes("demo")) {
      customer = await getCustomerByTokenOrKey(token);
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Authentication required. Please log in or complete checkout to access onboarding." },
        { status: 401 }
      );
    }

    const activeCust: any = customer;

    const name = (body.name ? String(body.name).trim() : activeCust.name || "Subscriber").slice(0, 100);
    const company = (body.company ? String(body.company).trim() : activeCust.company || "").slice(0, 100);
    const website = (body.website ? String(body.website).trim() : activeCust.website || "").slice(0, 255);
    const bot_title = (body.botTitle || body.bot_title ? String(body.botTitle || body.bot_title).trim() : activeCust.bot_title || "ZeroRoute AI").slice(0, 100);
    const bot_role = (body.botRole || body.bot_role ? String(body.botRole || body.bot_role).trim() : activeCust.bot_role || "AI Assistant").slice(0, 100);
    const tone = (body.tone ? String(body.tone).trim() : activeCust.tone || "helpful and concise").slice(0, 100);
    const greeting = (body.greeting ? String(body.greeting).trim() : activeCust.greeting || "Hi there! How can I help you today?").slice(0, 500);
    const prompts = Array.isArray(body.prompts) ? JSON.stringify(body.prompts.slice(0, 10).map((p: unknown) => String(p).slice(0, 200))) : (typeof body.prompts === "string" ? body.prompts.slice(0, 2000) : activeCust.prompts || "[]");
    const persona = (body.persona ? String(body.persona).trim() : activeCust.persona || "").slice(0, 10000);

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
