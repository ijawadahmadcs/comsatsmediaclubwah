import { logServerError } from "@/lib/api";

// Cloudflare Turnstile CAPTCHA. Enforced only when TURNSTILE_SECRET_KEY is set
// (with NEXT_PUBLIC_TURNSTILE_SITE_KEY for the widget on the join form).

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstileToken(token: unknown, remoteIp: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp !== "unknown") body.set("remoteip", remoteIp);
  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(10_000) });
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch (error) {
    logServerError("[TURNSTILE] Verification request failed", error);
    return false;
  }
}
