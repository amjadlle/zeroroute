import { SignJWT, jwtVerify } from "jose";

// Admin sessions are HS256 JWTs signed with ADMIN_SESSION_SECRET. Kept free of
// DB/next/headers imports so proxy.ts can use it. Stateless: logout cannot revoke
// a token; rotating ADMIN_SESSION_SECRET logs every admin out.
export const ADMIN_SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function secret(): Uint8Array | null {
  const s = process.env.ADMIN_SESSION_SECRET?.trim();
  return s && s.length >= 32 ? new TextEncoder().encode(s) : null;
}

export async function signAdminSession(): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin_master")
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(key);
}

export async function verifyAdminSession(token?: string | null): Promise<boolean> {
  const key = secret();
  if (!key || !token) return false;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.sub === "admin_master" && payload.role === "admin";
  } catch {
    return false;
  }
}
