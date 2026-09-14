import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const domains = Array.isArray(body.domains) ? body.domains : [];

    const db = getDb();
    await db.execute({
      sql: `UPDATE customers SET allowed_domains = ?, updated_at = ? WHERE key = ?`,
      args: [JSON.stringify(domains), Date.now(), session.key]
    });

    return NextResponse.json({
      success: true,
      allowedDomains: domains
    });
  } catch (err) {
    console.error("[CustomerDomains Error]:", err);
    return NextResponse.json({ error: "Failed to update allowed domains" }, { status: 400 });
  }
}
