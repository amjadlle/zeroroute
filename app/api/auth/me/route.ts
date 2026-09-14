import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCustomerByTokenOrKey } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    // 1. Check HTTP-only cookie first
    let customer = await getCurrentUser();

    // 2. Check Authorization Bearer header fallback
    if (!customer) {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      if (token) {
        customer = await getCustomerByTokenOrKey(token);
      }
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Return safe customer profile
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        key: customer.key,
        email: customer.email,
        name: customer.name,
        company: customer.company,
        website: customer.website,
        bot_title: customer.bot_title,
        bot_role: customer.bot_role,
        tone: customer.tone,
        greeting: customer.greeting,
        prompts: customer.prompts ? JSON.parse(customer.prompts) : [],
        persona: customer.persona,
        status: customer.status,
        subscription_expires: customer.subscription_expires,
        monthly_requests: customer.monthly_requests,
        monthly_limit: customer.monthly_limit,
        bot_id: customer.bot_id,
        created_at: customer.created_at,
      },
    });
  } catch (err: unknown) {
    console.error("Auth me error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve user profile." },
      { status: 500 }
    );
  }
}
