import { NextResponse } from "next/server";
import crypto from "crypto";
import { resolveAuth } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.execute(`
      SELECT 
        id, key, email, name, company, website, bot_title, bot_role,
        status, subscription_expires, monthly_requests, monthly_limit,
        bot_id, allowed_domains, created_at, updated_at
      FROM customers 
      ORDER BY created_at DESC
    `);

    const customers = result.rows || [];

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (err) {
    console.error("[AdminCustomers Error]:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, id, status, monthly_limit, rotateKey } = body;

    if (!key && !id) {
      return NextResponse.json({ error: "Customer key or ID is required" }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();

    if (rotateKey) {
      const custRes = await db.execute({
        sql: `SELECT key FROM customers WHERE key = ? OR id = ? LIMIT 1`,
        args: [key || "", id || ""]
      });
      const oldKey = (custRes.rows[0] as any)?.key;
      const newKey = `zr_live_${crypto.randomBytes(18).toString("hex")}`;

      await db.execute({
        sql: `UPDATE customers SET key = ?, updated_at = ? WHERE key = ? OR id = ?`,
        args: [newKey, now, key || "", id || ""]
      });

      if (oldKey) {
        await db.execute({
          sql: `UPDATE knowledge_documents SET customer_key = ? WHERE customer_key = ?`,
          args: [newKey, oldKey]
        });
        await db.execute({
          sql: `UPDATE request_logs SET customer_key = ? WHERE customer_key = ?`,
          args: [newKey, oldKey]
        });
      }

      return NextResponse.json({ success: true, newKey });
    }

    if (status) {
      await db.execute({
        sql: `UPDATE customers SET status = ?, updated_at = ? WHERE key = ? OR id = ?`,
        args: [status, now, key || "", id || ""]
      });
    }

    if (typeof monthly_limit === "number") {
      await db.execute({
        sql: `UPDATE customers SET monthly_limit = ?, updated_at = ? WHERE key = ? OR id = ?`,
        args: [monthly_limit, now, key || "", id || ""]
      });
    }

    return NextResponse.json({ success: true, message: "Customer updated successfully" });
  } catch (err) {
    console.error("[AdminCustomers Patch Error]:", err);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const id = url.searchParams.get("id");

    if (!key && !id) {
      return NextResponse.json({ error: "Customer key or ID is required" }, { status: 400 });
    }

    const db = getDb();
    const custRes = await db.execute({
      sql: `SELECT key FROM customers WHERE key = ? OR id = ? LIMIT 1`,
      args: [key || "", id || ""]
    });
    const targetKey = (custRes.rows[0] as any)?.key;

    await db.execute({
      sql: `DELETE FROM customers WHERE key = ? OR id = ?`,
      args: [key || "", id || ""]
    });

    if (targetKey) {
      await db.execute({
        sql: `DELETE FROM knowledge_documents WHERE customer_key = ?`,
        args: [targetKey]
      });
    }

    return NextResponse.json({ success: true, message: "Customer removed permanently" });
  } catch (err) {
    console.error("[AdminCustomers Delete Error]:", err);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
