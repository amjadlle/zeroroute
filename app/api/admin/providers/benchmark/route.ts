import { NextResponse } from "next/server";
import { resolveAuth } from "@/lib/auth/session";
import { providers } from "@/lib/providers/providers";
import { getRuntimeProviders, runtimeStateMap, TIMEOUT_MS } from "@/lib/providers/state";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized: Admin privileges required", results: [] }, { status: 401 });
  }

  const configured = getRuntimeProviders().filter(p => p.configured && p.enabled);
  if (configured.length === 0) {
    return NextResponse.json({ success: true, results: [] });
  }

  const providerPromises = configured.map(async (p) => {
    const provider = providers.find((x) => x.id === p.id);
    const models = p.models && p.models.length > 0 ? p.models : [p.model];
    const providerResults: Array<{
      providerId: string;
      providerName: string;
      model: string;
      status: "ok" | "error";
      latencyMs: number;
      response?: string;
      error?: string | null;
    }> = [];

    for (const model of models) {
      const start = Date.now();
      if (!provider) {
        providerResults.push({
          providerId: p.id,
          providerName: p.name,
          model,
          status: "error",
          latencyMs: 0,
          error: "Provider not found",
        });
        continue;
      }

      try {
        const result = await provider.generate(
          { messages: [{ role: "user", content: "Reply with the word OK." }], max_tokens: 64 },
          AbortSignal.timeout(TIMEOUT_MS),
          model
        );
        const latencyMs = Date.now() - start;
        providerResults.push({
          providerId: p.id,
          providerName: p.name,
          model,
          status: "ok",
          latencyMs,
          response: result.choices?.[0]?.message?.content || "OK",
          error: null,
        });
      } catch (error) {
        const latencyMs = Date.now() - start;
        const msg = error instanceof Error ? error.message : "Benchmark test failed";
        providerResults.push({
          providerId: p.id,
          providerName: p.name,
          model,
          status: "error",
          latencyMs,
          error: msg,
        });
      }
    }
    return providerResults;
  });

  const nestedResults = await Promise.all(providerPromises);
  const results = nestedResults.flat();
  // Sort by fastest latency first (successful ones before errors)
  results.sort((a, b) => {
    if (a.status === "ok" && b.status !== "ok") return -1;
    if (a.status !== "ok" && b.status === "ok") return 1;
    return a.latencyMs - b.latencyMs;
  });

  return NextResponse.json({
    success: true,
    count: results.length,
    results
  });
}
