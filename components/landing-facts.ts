// Plan numbers as the landing page prints them, derived from lib/constants so copy never drifts from billing.
import { PLAN_LIMITS } from "@/lib/constants";

export const FREE_REQUESTS = PLAN_LIMITS.free.monthlyRequests.toLocaleString("en-US"); // "500"
export const PRO_REQUESTS = PLAN_LIMITS.pro.monthlyRequests.toLocaleString("en-US"); // "10,000"
export const PRO_DAILY_REQUESTS = Math.floor(PLAN_LIMITS.pro.monthlyRequests / 30 / 10) * 10; // 330, rounded down to tens
export const PRO_PRICE = `$${PLAN_LIMITS.pro.priceUsd.toFixed(2)}`; // "$2.00"
export const FREE_PRICE = `$${PLAN_LIMITS.free.priceUsd}`; // "$0"
