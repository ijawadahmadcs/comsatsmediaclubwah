import { NextRequest, NextResponse } from "next/server";

const cookieName = "media_club_admin_session";

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function hasValidSession(token: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const [encoded, signature] = token?.split(".") || [];
  if (!encoded || !signature) return false;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), new TextEncoder().encode(encoded));
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encoded))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (!(await hasValidSession(request.cookies.get(cookieName)?.value))) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };