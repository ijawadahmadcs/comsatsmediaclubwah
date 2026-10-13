import { NextResponse } from "next/server";
import { jsonError, logServerError, readJsonObject } from "@/lib/api";
import { authenticateAdmin, normalizeRegistrationNumber, setAdminSession, validateAuthRuntimeConfig } from "@/lib/auth";
import { RATE_LIMITS, checkRateLimit, getClientIp, recordRateLimitHit } from "@/lib/rateLimit";

type Portal = "admin" | "teamlead";

const MAX_REGISTRATION_NUMBER_LENGTH = 40;
const MAX_PASSWORD_LENGTH = 200;

/** Password sign-in shared by the admin portal and the Team Lead portal. */
export async function handlePasswordLogin(request: Request, portal: Portal) {
  try {
    validateAuthRuntimeConfig();
  } catch (error) {
    logServerError("[AUTH] Runtime configuration is invalid", error);
    return jsonError("Sign-in is temporarily unavailable.", 503);
  }

  const body = await readJsonObject(request);
  const registrationNumber = body?.registrationNumber;
  const password = body?.password;
  if (typeof registrationNumber !== "string" || typeof password !== "string" || !registrationNumber.trim() || !password) {
    return jsonError("Registration number and password are required.", 400);
  }
  if (registrationNumber.length > MAX_REGISTRATION_NUMBER_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return jsonError("Registration number or password is too long.", 400);
  }

  const ip = getClientIp(request);
  const accountKey = normalizeRegistrationNumber(registrationNumber);
  try {
    const [ipStatus, accountStatus] = await Promise.all([
      checkRateLimit(RATE_LIMITS.loginPerIp, ip),
      checkRateLimit(RATE_LIMITS.loginPerAccount, accountKey),
    ]);
    if (ipStatus.limited || accountStatus.limited) {
      const retryAfter = Math.max(
        ipStatus.limited ? ipStatus.retryAfterSeconds : 0,
        accountStatus.limited ? accountStatus.retryAfterSeconds : 0,
      );
      return jsonError(
        `Too many failed sign-in attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    const account = await authenticateAdmin(registrationNumber, password);
    if (!account) {
      // Only failed attempts count, so staff who sign in normally never hit the limit.
      await Promise.all([
        recordRateLimitHit(RATE_LIMITS.loginPerIp, ip),
        recordRateLimitHit(RATE_LIMITS.loginPerAccount, accountKey),
      ]);
      return jsonError("Invalid credentials or inactive account.", 401);
    }

    if (portal === "admin" && account.role === "teamlead") {
      return jsonError("Team Lead accounts sign in at /team-lead/login.", 403);
    }
    if (portal === "teamlead" && account.role !== "teamlead") {
      return jsonError("This portal is for Team Leads. Admins sign in at /admin/login.", 403);
    }
    if (portal === "teamlead" && !account.team?.trim()) {
      return jsonError("This Team Lead account has no assigned team.", 403);
    }

    const admin = { id: account.id, registrationNumber: account.registrationNumber, name: account.name, role: account.role, team: account.team };
    const response = NextResponse.json(
      portal === "admin" ? { success: true, admin } : { success: true, redirect: "/team-lead/dashboard" },
    );
    await setAdminSession(response, account);
    return response;
  } catch (error) {
    logServerError("[AUTH LOGIN ERROR]", error);
    return jsonError("Sign-in is temporarily unavailable. Please try again shortly.", 503);
  }
}
