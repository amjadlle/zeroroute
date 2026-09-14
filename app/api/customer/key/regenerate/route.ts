import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";
import { getDb, initDb } from "@/lib/db";
import { generateApiKey } from "@/lib/auth/password";

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

    await initDb();
    const db = getDb();

    const newKey = generateApiKey();
    const now = Date.now();

    // Update key in customers table
    await db.execute({
      sql: "UPDATE customers SET key = ?, updated_at = ? WHERE id = ?",
      args: [newKey, now, customer.id],
    });

    // Migrate knowledge documents and request logs to new key
    await db.execute({
      sql: "UPDATE knowledge_documents SET customer_key = ? WHERE customer_key = ?",
      args: [newKey, customer.key],
    });

    await db.execute({
      sql: "UPDATE request_logs SET customer_key = ? WHERE customer_key = ?",
      args: [newKey, customer.key],
    });

    return NextResponse.json({
      success: true,
      message: "API key rotated successfully!",
      key: newKey,
    });
  } catch (err: unknown) {
    console.error("Key regenerate error:", err);
    return NextResponse.json({ error: "Failed to regenerate API key." }, { status: 500 });
  }
}
