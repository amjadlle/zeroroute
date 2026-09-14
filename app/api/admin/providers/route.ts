import { NextResponse } from "next/server";
import { resolveAuth } from "@/lib/auth/session";
import { getRuntimeProviders, runtimeStateMap, loadSavedProviderConfigs, persistProviderConfigs } from "@/lib/providers/state";
import { providers } from "@/lib/providers/providers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  await loadSavedProviderConfigs();
  const providersList = getRuntimeProviders();
  return NextResponse.json({
    success: true,
    providers: providersList
  });
}

export async function PUT(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const incomingProviders = body.providers;

    if (!Array.isArray(incomingProviders)) {
      return NextResponse.json({ error: "Invalid payload: providers array expected" }, { status: 400 });
    }

    incomingProviders.forEach((item: any, index: number) => {
      const existing = runtimeStateMap.get(item.id);
      if (!existing) return;

      existing.enabled = Boolean(item.enabled);
      existing.order = typeof item.order === "number" ? item.order : index + 1;

      if (Array.isArray(item.models) && item.models.length > 0) {
        existing.models = item.models.map((m: string) => m.trim()).filter(Boolean);
        existing.model = existing.models[0] || existing.model;
        const p = providers.find(x => x.id === item.id);
        if (p) p.model = existing.model;
      } else if (item.model && typeof item.model === "string" && item.model.trim()) {
        const m = item.model.trim();
        existing.model = m;
        if (!existing.models.includes(m)) {
          existing.models = [m, ...existing.models.filter(x => x !== m)];
        }
        const p = providers.find(x => x.id === item.id);
        if (p) p.model = m;
      }
    });

    const updated = getRuntimeProviders();
    await persistProviderConfigs(updated);

    return NextResponse.json({
      success: true,
      providers: updated
    });
  } catch (err) {
    console.error("[AdminProviders Update Error]:", err);
    return NextResponse.json({ error: "Failed to update providers" }, { status: 400 });
  }
}
