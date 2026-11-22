/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { isMasterAdminKey, getCachedCustomer, setCachedCustomer } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { isRateLimited, getClientIp } from "@/lib/auth/rate-limit";
import { ensureProviderConfigs, getEligibleProviders, TIMEOUT_MS, COOLDOWN_MS } from "@/lib/providers/state";
import { responseCache } from "@/lib/providers/cache";
import { buildDynamicSystemPrompt, retrieveKnowledgeContext, getDefaultLandingKnowledge } from "@/lib/providers/rag";
import {
  CHAT_LIMITS, attemptTimeoutMs, chatBodyError, contentText, inactiveMessage, isDemoOrigin, isFailoverError, isHostAllowed, isSameOrigin,
  modelChain, parseAllowedDomains, providerFailure, quotaExceededMessage, quotaLimit, renewedPeriod
} from "@/lib/providers/gateway";
import type { ChatRequest, ChatResponse } from "@/lib/providers/types";

export const dynamic = "force-dynamic";

// No credentials: cross-origin callers authenticate with a bearer key or bot id, never cookies.
const corsHdrs = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Bot-Id"
};

// Per-minute limits for the public widget/demo path (bot ids are public).
const WIDGET_IP_LIMIT = 30;
const DEMO_IP_LIMIT = 15;
const WIDGET_BOT_LIMIT = 300;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHdrs
  });
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const origin = request.headers.get("origin") || request.headers.get("referer") || "Direct API";
  const db = getDb();

  if (Number(request.headers.get("content-length") || 0) > CHAT_LIMITS.maxBodyBytes) {
    return NextResponse.json(
      { error: { message: "Request body too large" } },
      { status: 413, headers: corsHdrs }
    );
  }

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

  const bodyError = chatBodyError(body || {});
  if (bodyError) {
    return NextResponse.json(
      { error: { message: bodyError.message } },
      { status: bodyError.status, headers: corsHdrs }
    );
  }
  if (body.max_tokens !== undefined) body.max_tokens = Math.min(body.max_tokens, CHAT_LIMITS.maxTokens);
  // Normalise array (multimodal) content to text before RAG, quota and providers see it.
  body.messages = body.messages.map(m => ({ ...m, content: contentText(m.content) }));

  const rawBotId = xBotId || body.bot_id || (bearerToken.startsWith("bot_") ? bearerToken : undefined);
  let customerKey = bearerToken.startsWith("zr_live_") ? bearerToken : undefined;

  // Ceiling: isRateLimited is an in-memory Map, so these limits are per server instance
  // (N instances allow N x limit). Upgrade path: move the counters to a shared store
  // (Redis/Upstash or a DB counter table) keyed the same way.
  const isWidgetCall = Boolean(rawBotId) && !isMasterKey && !customerKey;
  if (isWidgetCall && isRateLimited(`widget_ip:${getClientIp(request.headers)}`, rawBotId === "demo" ? DEMO_IP_LIMIT : WIDGET_IP_LIMIT, 60_000)) {
    return NextResponse.json(
      { error: { message: "Too many messages. Please wait a minute and try again.", type: "rate_limited" } },
      { status: 429, headers: { ...corsHdrs, "Retry-After": "60" } }
    );
  }

  let customer: any = null;

  // Cookie session fallback (Admin Playground / App Dashboard): same-origin calls only.
  if (!bearerToken && !isMasterKey && !rawBotId && isSameOrigin(request.headers.get("origin"), new URL(request.url).host)) {
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
    if (!isDemoOrigin(request.headers.get("origin") || request.headers.get("referer"), process.env.NODE_ENV !== "production")) {
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

    body.max_tokens = Math.min(body.max_tokens || 500, 500);
    if (body.messages.filter(m => m.role === "user").some(m => (m.content || "").length > 2000)) {
      return NextResponse.json(
        { error: { message: "Demo message length limit is 2,000 characters." } },
        { status: 400, headers: corsHdrs }
      );
    }
  }

  // Per-bot limit, after the bot id is known to exist so unknown ids don't fill the limiter.
  if (isWidgetCall && isRateLimited(`widget_bot:${rawBotId}`, WIDGET_BOT_LIMIT, 60_000)) {
    return NextResponse.json(
      { error: { message: "This assistant is busy right now. Please try again in a minute.", type: "rate_limited" } },
      { status: 429, headers: { ...corsHdrs, "Retry-After": "60" } }
    );
  }

  // 4. Domain Whitelisting Validation (widget/bot_id calls only; bearer-key calls come from servers with no Origin)
  const allowed = isWidgetCall && customer ? parseAllowedDomains(customer.allowed_domains) : [];
  if (allowed.length > 0) {
    const callerOrigin = request.headers.get("origin") || request.headers.get("referer") || "";
    if (!isHostAllowed(callerOrigin, allowed)) {
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

  // 3. Customer subscription & quota check
  if (customer && customer.key) {
    const now = Date.now();
    // Query live real-time usage and limit from database
    const liveCustRes = await db.execute({
      sql: `SELECT status, monthly_requests, monthly_limit, period_start, period_end, created_at FROM customers WHERE key = ? LIMIT 1`,
      args: [customer.key]
    });
    const liveCust = liveCustRes.rows[0] as any;
    // Never fall back to the cached row: a rotated or deleted key must stop working immediately.
    if (!liveCust) {
      return NextResponse.json(
        { error: { message: "Invalid, expired, or revoked API key.", type: "invalid_key", code: 401 } },
        { status: 401, headers: corsHdrs }
      );
    }

    const isPublicWidget = Boolean(rawBotId && !bearerToken);

    if (liveCust.status !== "active") {
      return NextResponse.json(
        {
          error: {
            message: inactiveMessage(liveCust.status, isPublicWidget),
            type: "subscription_inactive"
          }
        },
        { status: 402, headers: corsHdrs }
      );
    }

    // Auto-reset monthly request counter when billing period expires (30 days cycle)
    const period = renewedPeriod(liveCust.period_end, now);
    if (period) {
      await db.execute({
        sql: `UPDATE customers SET monthly_requests = 0, period_start = ?, period_end = ?, updated_at = ? WHERE key = ?`,
        args: [period.start, period.end, now, customer.key]
      });
    }

    const limit = quotaLimit(liveCust.monthly_limit);

    // Atomic conditional increment: ensures no race condition can bypass quota
    const atomicUpdateRes = await db.execute({
      sql: `UPDATE customers SET monthly_requests = monthly_requests + 1, updated_at = ? WHERE key = ? AND monthly_requests < ?`,
      args: [now, customer.key, limit]
    });

    // The conditional UPDATE is the only source of truth: no row updated means no quota left.
    if (!atomicUpdateRes.rowsAffected) {
      return NextResponse.json(
        {
          error: {
            message: quotaExceededMessage(limit, isPublicWidget),
            type: "quota_exceeded",
            limit,
            current: limit
          }
        },
        { status: 429, headers: corsHdrs }
      );
    }
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
  await ensureProviderConfigs();
  const candidates = getEligibleProviders(body.model);
  if (candidates.length === 0) {
    return NextResponse.json(
      { error: { message: "No active AI cloud providers configured in ZeroRoute pool." } },
      { status: 503, headers: corsHdrs }
    );
  }

  // Upstream error bodies stay server-side (logs + admin request log); callers get this id instead.
  const requestId = crypto.randomUUID();
  const failures: string[] = [];

  let attempts = 0;
  const nextAttemptMs = () => attemptTimeoutMs(attempts, Date.now() - startTime, TIMEOUT_MS);
  const requestError = (error: any) => {
    console.error(`[Gateway ${requestId}] Upstream rejected the request:`, error.message);
    return NextResponse.json(
      { error: { message: "The AI provider rejected this request as invalid. Check the messages and parameters.", type: "invalid_request_error", request_id: requestId } },
      { status: error.status, headers: corsHdrs }
    );
  };
  const allFailed = () => {
    console.error(`[Gateway ${requestId}] All providers failed:`, failures);
    return NextResponse.json(
      { error: { message: "All configured AI cloud providers failed.", request_id: requestId } },
      { status: 502, headers: corsHdrs }
    );
  };

  // ── Streaming Mode (SSE) ──
  if (body.stream) {
    for (const { state, provider } of candidates) {
      const modelsToTry = modelChain(state.models, provider.model, body.model);
      let providerSuccess = false;
      let lastErr = "";

      for (const modelName of modelsToTry) {
        const timeoutMs = nextAttemptMs();
        if (!timeoutMs) break;
        attempts++;
        // The timeout covers time-to-first-chunk only; after that only a client cancel aborts upstream.
        const upstream = new AbortController();
        const ttfb = setTimeout(() => upstream.abort(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);
        try {
          const streamIterable = await provider.generateStream(body, upstream.signal, modelName);
          const iterator = streamIterable[Symbol.asyncIterator]();
          const first = await iterator.next();

          if (first.done) throw new Error(`${provider.id} returned an empty stream`);
          clearTimeout(ttfb);

          state.consecutiveFailures = 0;
          state.cooldownUntil = 0;
          providerSuccess = true;

          const responseStream = new ReadableStream({
            cancel() {
              upstream.abort();
            },
            async start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(first.value)}\n\n`));

              let fullContent = first.value.choices[0]?.delta?.content ?? "";

              try {
                for await (const chunk of { [Symbol.asyncIterator]: () => iterator }) {
                  fullContent += chunk.choices[0]?.delta?.content ?? "";
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
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

                // Log request telemetry before closing stream
                await db.execute({
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

                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              } catch (err) {
                if (upstream.signal.aborted) return; // client went away
                console.error("[Stream Pipe Error]:", err);
                const error = { message: "The upstream provider stream was interrupted.", type: "stream_error" };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error })}\n\n`));
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
          clearTimeout(ttfb);
          if (!isFailoverError(error)) return requestError(error);
          const errMsg = error instanceof Error ? error.message : "Streaming failed";
          lastErr = errMsg;
          failures.push(`${provider.id}/${modelName}: ${errMsg}`);
        }
      }

      if (!providerSuccess && lastErr) {
        Object.assign(state, providerFailure(state.consecutiveFailures, lastErr, Date.now(), COOLDOWN_MS));
      }
    }

    // Log failure telemetry
    await db.execute({
      sql: `INSERT INTO request_logs (id, customer_key, timestamp, origin, prompt_preview, response_preview, provider, model, latency_ms, status, is_stream, is_cache_hit, failovers, prompt_tokens, completion_tokens, total_tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        requestId,
        customerKey || "demo",
        Date.now(),
        origin,
        lastUserMsg.slice(0, 100),
        `All providers failed (request ${requestId})`,
        "gateway_failover",
        body.model || "stream",
        Date.now() - startTime,
        502,
        1,
        0,
        JSON.stringify(failures),
        0,
        0,
        0
      ]
    }).catch(() => {});

    return allFailed();
  }

  // ── Non-Streaming Mode (JSON) ──
  for (const { state, provider } of candidates) {
    const modelsToTry = modelChain(state.models, provider.model, body.model);
    let providerSuccess = false;
    let lastErr = "";

    for (const modelName of modelsToTry) {
      const timeoutMs = nextAttemptMs();
      if (!timeoutMs) break;
      attempts++;
      const start = Date.now();
      try {
        const result = await provider.generate(body, AbortSignal.timeout(timeoutMs), modelName);
        const latencyMs = Date.now() - start;

        state.consecutiveFailures = 0;
        state.cooldownUntil = 0;
        state.lastLatencyMs = latencyMs;

        responseCache.set(cacheKey, result);

        // Record telemetry log (awaited to guarantee edge persistence before response)
        await db.execute({
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
        if (!isFailoverError(error)) return requestError(error);
        const errMsg = error instanceof Error ? error.message : "Request failed";
        lastErr = errMsg;
        failures.push(`${provider.id}/${modelName}: ${errMsg}`);
      }
    }

    if (!providerSuccess && lastErr) {
      Object.assign(state, providerFailure(state.consecutiveFailures, lastErr, Date.now(), COOLDOWN_MS));
    }
  }

  // Log failure telemetry for non-streaming mode
  await db.execute({
    sql: `INSERT INTO request_logs (id, customer_key, timestamp, origin, prompt_preview, response_preview, provider, model, latency_ms, status, is_stream, is_cache_hit, failovers, prompt_tokens, completion_tokens, total_tokens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      requestId,
      customerKey || "demo",
      Date.now(),
      origin,
      lastUserMsg.slice(0, 100),
      `All providers failed (request ${requestId})`,
      "gateway_failover",
      body.model || "direct",
      Date.now() - startTime,
      502,
      0,
      0,
      JSON.stringify(failures),
      0,
      0,
      0
    ]
  }).catch(() => {});

  return allFailed();
}
