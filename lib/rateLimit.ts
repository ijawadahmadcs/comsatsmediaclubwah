import { createHash } from "node:crypto";
import connectToDatabase from "@/lib/mongodb";
import RateLimit from "@/models/RateLimit";

// Fixed-window rate limiting stored in MongoDB, so limits hold across serverless instances.

export type RateLimitRule = { name: string; limit: number; windowMs: number };

const MINUTE = 60_000;

export const RATE_LIMITS = {
  // Failed sign-ins only. Per account is looser than per IP so an attacker cannot easily lock an admin out.
  loginPerIp: { name: "login-ip", limit: 10, windowMs: 15 * MINUTE },
  loginPerAccount: { name: "login-account", limit: 20, windowMs: 15 * MINUTE },
  // Campus networks share one public IP, so keep this generous; CAPTCHA (if configured) is the main defence.
  applicationPerIp: { name: "application-ip", limit: 30, windowMs: 10 * MINUTE },
} satisfies Record<string, RateLimitRule>;

export type RateLimitStatus = { limited: boolean; retryAfterSeconds: number };

function getBucket(rule: RateLimitRule, subject: string) {
  const now = Date.now();
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
  // Hash the subject so raw IP addresses and registration numbers are not stored.
  const subjectHash = createHash("sha256").update(subject).digest("base64url").slice(0, 32);
  return {
    id: `${rule.name}:${subjectHash}:${windowStart}`,
    expiresAt: new Date(windowStart + rule.windowMs),
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart + rule.windowMs - now) / 1000)),
  };
}

/** Reports whether the subject has already used up the rule's limit, without counting a new hit. */
export async function checkRateLimit(rule: RateLimitRule, subject: string): Promise<RateLimitStatus> {
  await connectToDatabase();
  const bucket = getBucket(rule, subject);
  const current = await RateLimit.findById(bucket.id).lean();
  return { limited: (current?.count ?? 0) >= rule.limit, retryAfterSeconds: bucket.retryAfterSeconds };
}

/** Counts one hit against the rule. */
export async function recordRateLimitHit(rule: RateLimitRule, subject: string) {
  await connectToDatabase();
  const bucket = getBucket(rule, subject);
  await RateLimit.updateOne(
    { _id: bucket.id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: bucket.expiresAt } },
    { upsert: true },
  );
}

/** Counts one hit and reports whether the subject is now over the limit. */
export async function consumeRateLimit(rule: RateLimitRule, subject: string): Promise<RateLimitStatus> {
  await connectToDatabase();
  const bucket = getBucket(rule, subject);
  const current = await RateLimit.findOneAndUpdate(
    { _id: bucket.id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: bucket.expiresAt } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  return { limited: (current?.count ?? 1) > rule.limit, retryAfterSeconds: bucket.retryAfterSeconds };
}

// Vercel sets x-real-ip / x-forwarded-for itself. Self-hosted deployments must sit behind a proxy that does the same.
export function getClientIp(request: Request) {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
