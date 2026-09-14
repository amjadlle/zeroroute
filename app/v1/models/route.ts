import { NextResponse } from "next/server";
import { getRuntimeProviders } from "@/lib/providers/state";
import { isMasterAdminKey, getCustomerByTokenOrKey } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();

  // If a router/admin key is configured, enforce valid credentials or valid subscriber key
  const routerKey = process.env.ROUTER_API_KEY || process.env.ADMIN_KEY;
  if (routerKey && token) {
    const isMaster = isMasterAdminKey(token);
    let isCustomer = false;
    if (!isMaster) {
      const cust = await getCustomerByTokenOrKey(token);
      isCustomer = Boolean(cust && cust.status === "active");
    }
    if (!isMaster && !isCustomer) {
      return NextResponse.json({ error: { message: "Unauthorized: Invalid API key" } }, { status: 401 });
    }
  }

  const modelList = getRuntimeProviders()
    .filter(p => p.enabled)
    .map(p => ({
      id: p.model,
      object: "model",
      created: 1700000000,
      owned_by: p.id,
      permission: [],
      root: p.model,
      parent: null
    }));

  return NextResponse.json({ object: "list", data: modelList });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Bot-Id"
    }
  });
}
