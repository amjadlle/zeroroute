import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isLive = process.env.DODO_ENVIRONMENT === "live_mode";
  const productId = process.env.DODO_PRODUCT_ID || "pdt_0Nml3W2yZao32si4mSs6b";

  const originHeader = request.headers.get("origin") || request.headers.get("host") ? `https://${request.headers.get("host")}` : "";
  const siteBase = originHeader && !originHeader.includes("localhost") ? originHeader.replace(/\/$/, "") : (process.env.APP_URL || "https://zeroroute.mapki.in");
  const returnUrl = `${siteBase}/welcome`;

  const staticBuyUrl = `https://${isLive ? "" : "test."}checkout.dodopayments.com/buy/${productId}?redirect_url=${encodeURIComponent(returnUrl)}&return_url=${encodeURIComponent(returnUrl)}`;
  const checkoutUrl = process.env.DODO_CHECKOUT_URL || staticBuyUrl;

  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";
  const wantsJson = url.searchParams.get("format") === "json" || acceptHeader.includes("application/json");

  if (wantsJson) {
    return NextResponse.json({
      checkout_url: checkoutUrl,
      environment: process.env.DODO_ENVIRONMENT || "test_mode",
      product_id: productId
    });
  }

  return NextResponse.redirect(checkoutUrl, { status: 307 });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "checkout_user";
  if (isRateLimited(`checkout:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many checkout requests. Please wait a moment." }, { status: 429 });
  }

  const isLive = process.env.DODO_ENVIRONMENT === "live_mode";
  const productId = process.env.DODO_PRODUCT_ID || "pdt_0Nml3W2yZao32si4mSs6b";
  const originHeader = request.headers.get("origin") || request.headers.get("host") ? `https://${request.headers.get("host")}` : "";
  const siteBase = originHeader && !originHeader.includes("localhost") ? originHeader.replace(/\/$/, "") : (process.env.APP_URL || "https://zeroroute.mapki.in");
  const returnUrl = `${siteBase}/welcome`;
  const cancelUrl = `${siteBase}/#pricing`;

  const staticBuyUrl = `https://${isLive ? "" : "test."}checkout.dodopayments.com/buy/${productId}?redirect_url=${encodeURIComponent(returnUrl)}&return_url=${encodeURIComponent(returnUrl)}`;
  const fallbackUrl = process.env.DODO_CHECKOUT_URL || staticBuyUrl;

  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json({ checkout_url: fallbackUrl });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const dodoApiBase = isLive ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
    const res = await fetch(`${dodoApiBase}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        return_url: returnUrl,
        cancel_url: cancelUrl,
        customer: body.email ? { email: body.email, name: body.name || "Subscriber" } : undefined
      })
    });

    if (!res.ok) {
      console.warn("[DodoCheckout] API returned status:", res.status);
      return NextResponse.json({ checkout_url: fallbackUrl });
    }

    const sessionData = await res.json();
    const checkoutUrl = sessionData.checkout_url || sessionData.payment_link || sessionData.url || fallbackUrl;

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (err) {
    console.error("[DodoCheckout] Creation error:", err);
    return NextResponse.json({ checkout_url: fallbackUrl });
  }
}
