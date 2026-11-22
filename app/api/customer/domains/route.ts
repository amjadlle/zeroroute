import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { cleanDomains, domainLimitError } from "@/lib/providers/gateway";
import { getCurrentUser, getCustomerByTokenOrKey, invalidateCustomerLookupCache, invalidateSessionCache } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let session = await getCurrentUser();

  if (!session) {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
    if (token) {
      session = await getCustomerByTokenOrKey(token);
    }
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const cleanedDomains = cleanDomains(body.domains);
    const limitError = domainLimitError(cleanedDomains.length, session.monthly_limit);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 400 });
    }

    await initDb();
    const db = getDb();
    await db.execute({
      sql: `UPDATE customers SET allowed_domains = ?, updated_at = ? WHERE id = ?`,
      args: [JSON.stringify(cleanedDomains), Date.now(), session.id],
    });

    invalidateCustomerLookupCache(session.key);
    if (session.session_token) invalidateSessionCache(session.session_token);

    return NextResponse.json({
      success: true,
      allowedDomains: cleanedDomains,
    });
  } catch (err) {
    console.error("[CustomerDomains Error]:", err);
    return NextResponse.json({ error: "Failed to update allowed domains" }, { status: 400 });
  }
}
