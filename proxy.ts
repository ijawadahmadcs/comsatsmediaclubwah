import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getSessionSecret, verifySessionToken } from "@/lib/sessionToken";

// Page redirects here are for user experience only. Every API route enforces its own role check.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ALLOWED_BODY_TYPES = /^(application\/json|multipart\/form-data)\b/i;

function forbidden(message: string, status = 403) {
  return NextResponse.json({ success: false, message, error: message }, { status });
}

function requestHosts(request: NextRequest) {
  return [request.headers.get("x-forwarded-host"), request.headers.get("host"), request.nextUrl.host]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.split(",")[0].trim().toLowerCase());
}

// Blocks cross-site form posts and fetches (CSRF). SameSite=Lax cookies already stop most of these;
// this check keeps state-changing APIs safe if that ever changes.
function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return requestHosts(request).includes(new URL(origin).host.toLowerCase());
    } catch {
      return false;
    }
  }
  // No Origin header (non-browser clients): fall back to Fetch Metadata when the browser sends it.
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
}

function guardApiRequest(request: NextRequest) {
  if (SAFE_METHODS.has(request.method)) return NextResponse.next();
  if (!isSameOriginRequest(request)) return forbidden("Cross-site requests are not allowed.");
  const contentType = request.headers.get("content-type");
  if (contentType && !ALLOWED_BODY_TYPES.test(contentType)) return forbidden("Unsupported content type.", 415);
  return NextResponse.next();
}

async function getSessionRole(request: NextRequest) {
  const secret = getSessionSecret();
  if (!secret) return null;
  const payload = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, secret);
  return payload?.role ?? null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) return guardApiRequest(request);
  if (pathname === "/admin/login" || pathname === "/team-lead/login") return NextResponse.next();

  const role = await getSessionRole(request);
  const isTeamLeadPortal = pathname === "/team-lead" || pathname.startsWith("/team-lead/");

  if (isTeamLeadPortal) {
    if (role === "teamlead") return NextResponse.next();
    return NextResponse.redirect(new URL(role ? "/admin" : "/team-lead/login", request.url));
  }

  if (role === "admin" || role === "superadmin") return NextResponse.next();
  return NextResponse.redirect(new URL(role === "teamlead" ? "/team-lead/dashboard" : "/admin/login", request.url));
}

export const config = { matcher: ["/admin/:path*", "/team-lead/:path*", "/api/:path*"] };
