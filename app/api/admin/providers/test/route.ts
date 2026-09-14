import { NextResponse } from "next/server";
import { resolveAuth } from "@/lib/auth/session";
import { providers } from "@/lib/providers/providers";
import { runtimeStateMap, TIMEOUT_MS } from "@/lib/providers/state";

export const dynamic = "force-dynamic";

function getNonChatModelDiagnostic(model: string): string | null {
  const m = model.toLowerCase();
  if (m.includes("whisper")) {
    return "Audio STT Model: Whisper requires audio files via /v1/audio/transcriptions (chat completions not supported)";
  }
  if (m.includes("embed") || m.includes("bge") || m.includes("e5") || m.includes("minilm") || m.includes("sentence-transformers") || m.includes("gte-")) {
    return "Vector Embedding Model: Dedicated vector embedding model for semantic search & RAG (use /v1/embeddings endpoint)";
  }
  if (m.includes("distilbert") || m.includes("sst-2") || m.includes("classifier") || m.includes("sentiment")) {
    return "Text Classifier Model: Dedicated sentiment & intent classifier model (use /v1/models/pipeline/text-classification endpoint)";
  }
  if (m.includes("m2m100") || m.includes("translation")) {
    return "Machine Translation Model: Translation model requires text & target_lang via translation endpoints (chat completions not supported)";
  }
  if (m.includes("rerank")) {
    return "Semantic Reranker: Model requires query & documents via /v1/rerank endpoint (chat completions not supported)";
  }
  if (m.includes("tts") || m.includes("fish-audio") || m.includes("deepgram")) {
    return "Text-to-Speech Model: Voice synthesis model via /v1/audio/speech endpoint (chat completions not supported)";
  }
  return null;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const auth = await resolveAuth(authHeader);

  if (!auth.isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const providerId = body.providerId || body.id;
    const modelToUse = body.model;

    const provider = providers.find(p => p.id === providerId);
    const state = runtimeStateMap.get(providerId);

    if (!provider) {
      return NextResponse.json({ ok: false, error: `Unknown provider: ${providerId}` }, { status: 404 });
    }

    const targetModel = modelToUse || state?.model || provider.model;
    const diagnostic = getNonChatModelDiagnostic(targetModel);

    if (diagnostic) {
      return NextResponse.json({
        ok: false,
        error: diagnostic,
        latencyMs: 0,
        model: targetModel,
        provider: providerId
      });
    }

    const start = Date.now();
    try {
      const result = await provider.generate(
        { messages: [{ role: "user", content: "Reply with the word OK." }], max_tokens: 64 },
        AbortSignal.timeout(TIMEOUT_MS),
        targetModel
      );
      const latencyMs = Date.now() - start;

      if (state) {
        state.lastLatencyMs = latencyMs;
        state.consecutiveFailures = 0;
        state.cooldownUntil = 0;
      }

      return NextResponse.json({
        ok: true,
        provider: result.provider,
        model: result.model,
        latencyMs,
        response: result.choices?.[0]?.message?.content || "OK",
        telemetry: result.telemetry || null
      });
    } catch (error) {
      const latencyMs = Date.now() - start;
      const msg = error instanceof Error ? error.message : "Provider test failed";
      if (state) {
        state.lastError = msg;
        state.consecutiveFailures = (state.consecutiveFailures || 0) + 1;
      }

      return NextResponse.json({
        ok: false,
        error: msg,
        latencyMs,
        model: targetModel,
        provider: providerId
      });
    }
  } catch (err) {
    console.error("[ProviderTest Error]:", err);
    return NextResponse.json({ error: "Invalid test request payload" }, { status: 400 });
  }
}
