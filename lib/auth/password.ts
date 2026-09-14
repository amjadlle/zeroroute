import crypto from "crypto";

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}

export function generateApiKey(): string {
  return `zr_live_${crypto.randomBytes(24).toString("hex")}`;
}

export function generateSessionToken(): string {
  return `zr_sess_${crypto.randomBytes(32).toString("hex")}`;
}

export function generateBotId(): string {
  return `bot_${crypto.randomBytes(12).toString("hex")}`;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
