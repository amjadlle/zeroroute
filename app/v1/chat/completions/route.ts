import { NextResponse } from "next/server";
import crypto from "crypto";
import { isMasterAdminKey, getCachedCustomer, setCachedCustomer } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/auth/rate-limit";
import { getEligibleProviders, TIMEOUT_MS, COOLDOWN_MS } from "@/lib/providers/state";
import { responseCache } from "@/lib/providers/cache";
import { buildDynamicSystemPrompt, retrieveKnowledgeContext, getDefaultLandingKnowledge } from "@/lib/providers/rag";
import type { ChatRequest, ChatResponse } from "@/lib/providers/types";

export const dynamic = "force-dynamic";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Bot-Id",
  "Access-Control-Allow-Credentials": "true"
});

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin)
  });
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const origin = request.headers.get("origin") || request.headers.get("referer") || "Direct API";
  const corsHdrs = getCorsHeaders(origin);
  const db = getDb();

  // Extract authentication tokens
  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
  const xBotId = request.headers.get("x-bot-id");
  let isMasterKey = Boolean(isMasterAdminKey(bearerToken));

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON request body" } },
      { status: 400, headers: corsHdrs }
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: { message: "messages must be a non-empty array" } },
      { status: 400, headers: corsHdrs }
    );
  }

  const rawBotId = xBotId || body.bot_id || (bearerToken.startsWith("bot_") ? bearerToken : undefined);
  let customerKey = bearerToken.startsWith("zr_live_") ? bearerToken : undefined;

  let customer: any = null;

  // Check cookie session fallback if no bearer token provided (e.g. Admin Playground or App Dashboard)
  if (!bearerToken && !isMasterKey && !rawBotId) {
    try {
      const { getCurrentUser } = await import("@/lib/auth/session");
      const user = await getCurrentUser();
      if (user) {
        if (user.id === "admin_master") {
          isMasterKey = true;
        } else if (user.key) {
          customer = user;
          customerKey = user.key;
        }
      }
    } catch {}
  }

  const lookupIdentifier = customerKey || (rawBotId && rawBotId !== "demo" ? rawBotId : null) || (bearerToken && bearerToken.length > 5 && !isMasterKey ? bearerToken : null);

  if (lookupIdentifier) {
    const cached = getCachedCustomer(lookupIdentifier);
    if (cached) {
      customer = cached;
      if (customer) customerKey = customer.key;
    }
  }

  // Resolve customer by key or bot ID if not in memory cache
  if (!customer && lookupIdentifier) {
    if (customerKey) {
      const res = await db.execute({
        sql: `SELECT * FROM customers WHERE key = ? LIMIT 1`,
        args: [customerKey]
      });
      customer = res.rows[0] || null;
    } else if (rawBotId && rawBotId !== "demo") {
      const res = await db.execute({
        sql: `SELECT * FROM customers WHERE bot_id = ? LIMIT 1`,
        args: [rawBotId]
      });
      customer = res.rows[0] || null;
      if (customer) {
        customerKey = customer.key;
      }
    } else if (bearerToken && bearerToken.length > 5 && !isMasterKey) {
      const res = await db.execute({
        sql: `SELECT * FROM customers WHERE key = ? LIMIT 1`,
        args: [bearerToken]
      });
      customer = res.rows[0] || null;
      if (customer) {
        customerKey = customer.key;
      }
    }

    if (customer) {
      setCachedCustomer(lookupIdentifier, customer);
    }
  }

  // 1. Strict Direct API Authentication Lock:
  // If request is a Direct API call (no bot ID, or invalid key), reject immediately with 401
  if (!rawBotId && !isMasterKey && !customer) {
    return NextResponse.json(
      {
        error: {
          message: bearerToken
            ? "Invalid, expired, or revoked API key."
            : "Authentication required. Please provide your API key via 'Authorization: Bearer <your_api_key>' or configure your embed chatbot 'X-Bot-Id'.",
          type: "invalid_key",
          code: 401
        }
      },
      { status: 401, headers: corsHdrs }
    );
  }

  // 2. Chatbot ID Validation (If a bot ID was provided but not found in DB)
  if (rawBotId && rawBotId !== "demo" && !customer) {
    return NextResponse.json(
      {
        error: {
          message: "Invalid or unknown Chatbot ID. Please verify your data-bot-id in the ZeroRoute Console.",
          type: "invalid_bot_id",
          code: 404
        }
      },
      { status: 404, headers: corsHdrs }
    );
  }

  // 3. Demo Bot Validation (Strictly locked to official ZeroRoute website)
  if (rawBotId === "demo") {
    const callerOrigin = (request.headers.get("origin") || request.headers.get("referer") || "").toLowerCase();
    const isOfficialSite =
      callerOrigin.includes("zeroroute.mapki.in") ||
      callerOrigin.includes("mapki.in") ||
      callerOrigin.includes("localhost") ||
      callerOrigin.includes("127.0.0.1");

    if (!isOfficialSite && origin === "Direct API") {
      return NextResponse.json(
        {
          error: {
            message: "The demo chatbot is strictly authorized on https://zeroroute.mapki.in. Direct API/CLI inference requires a valid API key.",
            type: "unauthorized_demo_origin",
            code: 403
          }
        },
        { status: 403, headers: corsHdrs }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "demo_user";
    if (isRateLimited(`demo_chat:${ip}`, 15, 60_000)) {
      return NextResponse.json(
        { error: { message: "Demo rate limit reached (15 req/min). Please wait a moment or sign up for ZeroRoute Pro." } },
        { status: 429, headers: corsHdrs }
      );
    }
    body.max_tokens = Math.min(body.max_tokens || 500, 500);
    if (body.messages.filter(m => m.role === "user").some(m => (m.content || "").length > 2000)) {
      return NextResponse.json(
        { error: { message: "Demo message length limit is 2,000 characters." } },
        { status: 400, headers: corsHdrs }
      );
    }
  }

  // 4. Domain Whitelisting Validation (for paying customer bots)
  if (customer && customer.allowed_domains) {
    try {
      const allowed = typeof customer.allowed_domains === "string" ? JSON.parse(customer.allowed_domains) : customer.allowed_domains;
      if (Array.isArray(allowed) && allowed.length > 0) {
        const callerOrigin = request.headers.get("origin") || request.headers.get("referer") || "";
        const cleanOrigin = callerOrigin.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();

        const isAllowed = allowed.some((d: string) => {
          const domainPattern = d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          if (domainPattern === "*") return true;
          return cleanOrigin === domainPattern || cleanOrigin.endsWith("." + domainPattern);
        });

        if (!isAllowed) {
          return NextResponse.json(
            {
              error: {
                message: `Domain '${callerOrigin}' is not authorized to use this chatbot. Please add it to your allowed domains in the ZeroRoute Console.`,
                type: "domain_not_allowed",
                code: 403
              }
            },
            { status: 403, headers: corsHdrs }
          );
        }
      }
    } catch {
      // Ignore domain parsing errors
    }
  }

  // 3. Customer subscription & quota check
  if (customer && customer.key) {
    // Query live real-time usage and limit from database for 100% precision
    const liveCustRes = await db.execute({
      sql: `SELECT status, monthly_requests, monthly_limit FROM customers WHERE key = ? LIMIT 1`,
      args: [customer.key]
    });
    const liveCust = (liveCustRes.rows[0] as any) || customer;

    const isPublicWidget = Boolean(rawBotId && !bearerToken);

    if (liveCust.status !== "active") {
      const errorMessage = isPublicWidget
        ? "This assistant is temporarily unavailable. Please contact the website owner or try again later."
        : `Your ZeroRoute subscription is currently inactive (${liveCust.status}). Please visit your dashboard to manage billing.`;
      return NextResponse.json(
        {
          error: {
            message: errorMessage,
            type: "subscription_inactive"
          }
        },
        { status: 402, headers: corsHdrs }
      );
    }

    const currentUsage = Number(liveCust.monthly_requests || 0);
    const limit = Number(liveCust.monthly_limit !== undefined ? liveCust.monthly_limit : 500);

    if (currentUsage >= limit) {
      const errorMessage = isPublicWidget
        ? "This assistant has reached its monthly conversation limit and is temporarily unavailable. Please contact the website owner or check back next month."
        : `Monthly request quota of ${limit.toLocaleString()} requests reached (${currentUsage}/${limit} used). Please upgrade to ZeroRoute Pro for 10,000 requests/month.`;
      return NextResponse.json(
        {
          error: {
            message: errorMessage,
            type: "quota_exceeded",
            limit,
            current: currentUsage
          }
        },
        { status: 429, headers: corsHdrs }
      );
    }

    // Increment usage counter in DB
    db.execute({
      sql: `UPDATE customers SET monthly_requests = monthly_requests + 1, updated_at = ? WHERE key = ?`,
      args: [Date.now(), customer.key]
    }).catch((err: unknown) => console.error("[DB Usage Update Error]:", err));
  }

  // 4. Dynamic System Prompt & RAG Context Injection
  const lastUserMsg = [...body.messages].reverse().find(m => m.role === "user")?.content || "";
  let ragContext = "";
  let defaultPersona = "";

  if (customerKey) {
    ragContext = await retrieveKnowledgeContext(customerKey, lastUserMsg, 3000);
  } else {
    const defaults = getDefaultLandingKnowledge();
    defaultPersona = defaults.persona;
    ragContext = defaults.knowledge;
  }

  const dynamicSystemPrompt = buildDynamicSystemPrompt({
    companyName: customer?.company || customer?.name || "ZeroRoute",
    botTitle: customer?.bot_title || "ZeroRoute AI Assistant",
    botRole: customer?.bot_role || "ZeroRoute AI & Multi-Cloud Specialist",
    tone: customer?.tone || "friendly, concise, and developer-focused",
    customPersona: customer?.persona || defaultPersona,
    knowledgeContext: ragContext
  });

  // Security: For widget/bot requests, strip any client-supplied system messages entirely
  // to prevent prompt-injection attacks. For direct API calls (bearer key only), allow
  // the developer's system message to be appended after ours (trusted path).
  const isWidgetRequest = Boolean(rawBotId);
  if (isWidgetRequest) {
    // Remove all client-sent system messages — our prompt is the only authority
    const userAndAssistantMessages = body.messages.filter(m => m.role !== "system");
    body.messages = [{ role: "system", content: dynamicSystemPrompt }, ...userAndAssistantMessages];
  } else {
    // Direct API: prepend our system prompt, keep developer's system message appended
    const existingSystem = body.messages.find(m => m.role === "system");
    if (existingSystem) {
      body.messages = body.messages.map(m =>
        m.role === "system" ? { ...m, content: `${dynamicSystemPrompt}\n\n${m.content}` } : m
      );
    } else {
      body.messages = [{ role: "system", content: dynamicSystemPrompt }, ...body.messages];
    }
  }

  // 5. Response Caching Check
  const cacheKey = responseCache.generateKey(body);
  const cached = responseCache.get(cacheKey);

  if (cached) {
    if (body.stream) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          for await (const chunk of responseCache.streamCachedResponse(cached)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Cache": "HIT",
          ...corsHdrs
        }
      });
    }

    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT", ...corsHdrs }
    });
  }

  // 6. Multi-Cloud Provider Pool Failover Routing
  const candidates = getEligibleProviders(body.model);
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: { message: "No active AI cloud providers configured in ZeroRoute pool." } },
      { status: 503, headers: corsHdrs }
    );
  }

  const failures: string[] = [];

  const getModelChain = (stateModels: string[] | undefined, defaultModel: string, targetModel?: string): string[] => {
    const base = stateModels && stateModels.length > 0 ? [...stateModels] : [defaultModel];
    if (targetModel && targetModel !== "auto" && targetModel !== "default") {
      const idx = base.findIndex(m => m.toLowerCase() === targetModel.toLowerCase());
      if (idx > 0) {
        const matched = base.splice(idx, 1)[0];
        return [matched, ...base];
      }
    }
    return base;
  };

  // ── Streaming Mode (SSE) ──
  if (body.stream) {
    for (const { state, provider } of candidates) {
      const modelsToTry = getModelChain(state.models, provider.model, body.model);
      let providerSuccess = false;
      let lastErr = "";

      for (const modelName of modelsToTry) {
        try {
          const streamIterable = await provider.generateStream(
            body,
            AbortSignal.timeout(TIMEOUT_MS),
            modelName
          );
          const iterator = streamIterable[Symbol.asyncIterator]();
          const first = await iterator.next();

          if (first.done) throw new Error(`${provider.id} returned an empty stream`);

          state.consecutiveFailures = 0;
          state.cooldownUntil = 0;
          providerSuccess = true;

          const responseStream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(first.value)}\n\n`));

              let fullContent = first.value.choices[0]?.delta?.content ?? "";

              try {
                for await (const chunk of { [Symbol.asyncIterator]: () => iterator }) {
                  fullContent += chunk.choices[0]?.delta?.content ?? "";
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();

                // Cache reconstructed response
                const reconstructed: ChatResponse = {
                  id: first.value.id,
                  object: "chat.completion",
                  created: Math.floor(Date.now() / 1000),
                  provider: provider.id,
                  model: modelName,
                  choices: [{ index: 0, message: { role: "assistant", content: fullContent }, finish_reason: "stop" }]
                };
                responseCache.set(cacheKey, reconstructed);

                // Log request telemetry
                db.execute({
                  sql: `INSERT INTO request_logs (id, customer_key, timestamp, origin, prompt_preview, response_preview, provider, model, latency_ms, status, is_stream, is_cache_hit, failovers, prompt_tokens, completion_tokens, total_tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  args: [
                    first.value.id || crypto.randomUUID(),
                    customerKey || "demo",
                    Date.now(),
                    origin,
                    lastUserMsg.slice(0, 100),
                    fullContent.slice(0, 100),
                    provider.id,
                    modelName,
                    Date.now() - startTime,
                    200,
                    1,
                    0,
                    JSON.stringify(failures),
                    0,
                    0,
                    0
                  ]
                }).catch((e: unknown) => console.error("[Telemetry Log Error]:", e));
              } catch (err) {
                console.error("[Stream Pipe Error]:", err);
                controller.close();
              }
            }
          });

          return new Response(responseStream, {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Cache": "MISS",
              ...corsHdrs
            }
          });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : "Streaming failed";
          lastErr = errMsg;
          failures.push(`${provider.id}/${modelName}: ${errMsg}`);
        }
      }

      if (!providerSuccess) {
        state.consecutiveFailures = (state.consecutiveFailures || 0) + 1;
        state.cooldownUntil = Date.now() + COOLDOWN_MS;
        state.lastError = lastErr;
      }
    }

    return NextResponse.json(
      { error: { message: "All configured AI cloud providers failed.", details: failures } },
      { status: 502, headers: corsHdrs }
    );
  }

  // ── Non-Streaming Mode (JSON) ──
  for (const { state, provider } of candidates) {
    const modelsToTry = getModelChain(state.models, provider.model, body.model);
    let providerSuccess = false;
    let lastErr = "";

    for (const modelName of modelsToTry) {
      const start = Date.now();
      try {
        const result = await provider.generate(body, AbortSignal.timeout(TIMEOUT_MS), modelName);
        const latencyMs = Date.now() - start;

        state.consecutiveFailures = 0;
        state.cooldownUntil = 0;
        state.lastLatencyMs = latencyMs;

        responseCache.set(cacheKey, result);

        // Record telemetry log
        db.execute({
          sql: `INSERT INTO request_logs (id, customer_key, timestamp, origin, prompt_preview, response_preview, provider, model, latency_ms, status, is_stream, is_cache_hit, failovers, prompt_tokens, completion_tokens, total_tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            result.id || crypto.randomUUID(),
            customerKey || "demo",
            Date.now(),
            origin,
            lastUserMsg.slice(0, 100),
            result.choices[0]?.message?.content?.slice(0, 100) || "",
            provider.id,
            result.model,
            Date.now() - startTime,
            200,
            0,
            0,
            JSON.stringify(failures),
            result.usage?.prompt_tokens || 0,
            result.usage?.completion_tokens || 0,
            result.usage?.total_tokens || 0
          ]
        }).catch((e: unknown) => console.error("[Telemetry Log Error]:", e));

        providerSuccess = true;
        return NextResponse.json(result, {
          headers: { "X-Cache": "MISS", ...corsHdrs }
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Request failed";
        lastErr = errMsg;
        failures.push(`${provider.id}/${modelName}: ${errMsg}`);
      }
    }

    if (!providerSuccess) {
      state.consecutiveFailures = (state.consecutiveFailures || 0) + 1;
      state.cooldownUntil = Date.now() + COOLDOWN_MS;
      state.lastError = lastErr;
    }
  }

  return NextResponse.json(
    { error: { message: "All configured AI cloud providers failed.", details: failures } },
    { status: 502, headers: corsHdrs }
  );
}
