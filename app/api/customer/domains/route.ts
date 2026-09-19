import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getSessionFromCookie, getCustomerByTokenOrKey, invalidateCustomerLookupCache, invalidateSessionCache } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let session = await getSessionFromCookie();

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
    const rawDomains = Array.isArray(body.domains) ? body.domains : [];

    // Clean domains (strip protocol, paths, and lowercase)
    const cleanedDomains = Array.from(
      new Set(
        rawDomains
          .map((d: any) =>
            String(d || "")
              .trim()
              .toLowerCase()
              .replace(/^https?:\/\//, "")
              .replace(/\/.*$/, "")
              .replace(/:\d+$/, "")
          )
          .filter((d: string) => Boolean(d) && d.length > 2)
      )
    );

    const isPro = Boolean(session.monthly_limit && session.monthly_limit >= 10000);
    const maxAllowed = isPro ? 3 : 1;

    if (cleanedDomains.length > maxAllowed) {
      return NextResponse.json(
        {
          error: isPro
            ? `Pro accounts can whitelist up to 3 domains.`
            : `Free accounts can whitelist 1 website domain. Upgrade to Pro for up to 3 domains.`,
        },
        { status: 400 }
      );
    }

    await initDb();
    const db = getDb();
    await db.execute({
      sql: `UPDATE customers SET allowed_domains = ?, updated_at = ? WHERE id = ?`,
      args: [JSON.stringify(cleanedDomains), Date.now(), session.id],
    });

    invalidateCustomerLookupCache();
    invalidateSessionCache();

    return NextResponse.json({
      success: true,
      allowedDomains: cleanedDomains,
    });
  } catch (err) {
    console.error("[CustomerDomains Error]:", err);
    return NextResponse.json({ error: "Failed to update allowed domains" }, { status: 400 });
  }
}
