import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

async function createDodoCheckoutSession(request: Request, customerData?: { email?: string; name?: string }) {
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
    return fallbackUrl;
  }

  try {
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
        feature_flags: {
          redirect_immediately: true
        },
        return_url: returnUrl,
        cancel_url: cancelUrl,
        customer: customerData?.email ? { email: customerData.email, name: customerData.name || "Subscriber" } : undefined
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[DodoCheckout] API returned status:", res.status, errText);
      return fallbackUrl;
    }

    const sessionData = await res.json();
    return sessionData.checkout_url || sessionData.payment_link || sessionData.url || fallbackUrl;
  } catch (err) {
    console.error("[DodoCheckout] Creation error:", err);
    return fallbackUrl;
  }
}

export async function GET(request: Request) {
  const checkoutUrl = await createDodoCheckoutSession(request);

  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";
  const wantsJson = url.searchParams.get("format") === "json" || acceptHeader.includes("application/json");

  if (wantsJson) {
    return NextResponse.json({
      checkout_url: checkoutUrl,
      environment: process.env.DODO_ENVIRONMENT || "test_mode",
      product_id: process.env.DODO_PRODUCT_ID || "pdt_0Nml3W2yZao32si4mSs6b"
    });
  }

  return NextResponse.redirect(checkoutUrl, { status: 307 });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "checkout_user";
  if (isRateLimited(`checkout:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many checkout requests. Please wait a moment." }, { status: 429 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const checkoutUrl = await createDodoCheckoutSession(request, {
    email: body.email,
    name: body.name
  });

  return NextResponse.json({ checkout_url: checkoutUrl });
}
