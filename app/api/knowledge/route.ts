import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCustomerByTokenOrKey, resolveAuth } from "@/lib/auth/session";
import { getDb, initDb } from "@/lib/db";

async function resolveTargetKey(req: NextRequest, body?: any): Promise<{ customerKey: string | null; isAdmin: boolean }> {
  let customer = await getCurrentUser();
  const authHeader = req.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!customer && auth.customer) {
    customer = auth.customer;
  }

  if (!customer && !auth.isAdmin) {
    return { customerKey: null, isAdmin: false };
  }

  const isAdmin = auth.isAdmin || customer?.id === "admin_master";

  if (isAdmin) {
    const { searchParams } = new URL(req.url);
    const targetKey = searchParams.get("target_key") || body?.target_key;
    const botId = searchParams.get("bot_id") || body?.bot_id;

    if (targetKey) return { customerKey: targetKey, isAdmin: true };
    if (botId) {
      await initDb();
      const db = getDb();
      const res = await db.execute({
        sql: "SELECT key FROM customers WHERE bot_id = ? LIMIT 1",
        args: [botId],
      });
      if (res.rows.length > 0) {
        return { customerKey: (res.rows[0] as any).key, isAdmin: true };
      }
    }
  }

  return { customerKey: customer?.key || "zr_admin_master", isAdmin };
}

// GET /api/knowledge -> List knowledge documents
export async function GET(req: NextRequest) {
  try {
    const { customerKey } = await resolveTargetKey(req);

    if (!customerKey) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await initDb();
    const db = getDb();

    const result = await db.execute({
      sql: "SELECT * FROM knowledge_documents WHERE customer_key = ? ORDER BY created_at DESC",
      args: [customerKey],
    });

    return NextResponse.json({
      success: true,
      documents: result.rows,
    });
  } catch (err: unknown) {
    console.error("Knowledge GET error:", err);
    return NextResponse.json({ error: "Failed to fetch knowledge documents." }, { status: 500 });
  }
}

// POST /api/knowledge -> Add knowledge document
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerKey } = await resolveTargetKey(req, body);

    if (!customerKey) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const title = (body.title || "Knowledge Document").trim();
    const content = (body.content || "").trim();
    const type = body.type || "manual_text";
    const source_url = body.source_url || null;

    if (!content) {
      return NextResponse.json({ error: "Document content cannot be empty." }, { status: 400 });
    }

    await initDb();
    const db = getDb();

    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    await db.execute({
      sql: `
        INSERT INTO knowledge_documents (id, customer_key, title, type, content, char_count, source_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, customerKey, title, type, content, content.length, source_url, now],
    });

    try {
      const { invalidateDocCache } = await import("@/lib/providers/rag");
      invalidateDocCache(customerKey);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Knowledge document added successfully!",
      document: {
        id,
        title,
        type,
        char_count: content.length,
        created_at: now,
      },
    });
  } catch (err: unknown) {
    console.error("Knowledge POST error:", err);
    return NextResponse.json({ error: "Failed to add knowledge document." }, { status: 500 });
  }
}

// DELETE /api/knowledge -> Delete knowledge document
export async function DELETE(req: NextRequest) {
  try {
    const { customerKey, isAdmin } = await resolveTargetKey(req);

    if (!customerKey) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    await initDb();
    const db = getDb();

    if (isAdmin) {
      await db.execute({
        sql: "DELETE FROM knowledge_documents WHERE id = ?",
        args: [id],
      });
    } else {
      await db.execute({
        sql: "DELETE FROM knowledge_documents WHERE id = ? AND customer_key = ?",
        args: [id, customerKey],
      });
    }

    try {
      const { invalidateDocCache } = await import("@/lib/providers/rag");
      invalidateDocCache(customerKey);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Knowledge document deleted successfully.",
    });
  } catch (err: unknown) {
    console.error("Knowledge DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete knowledge document." }, { status: 500 });
  }
}
