// Session token signing and verification, shared by proxy.ts and the API routes.
// Uses Web Crypto so the same code runs in every Next.js runtime.

import type { AdminRole } from "@/models/Admin";

export const SESSION_COOKIE = "media_club_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;
export const MIN_SESSION_SECRET_LENGTH = 32;

const ROLES: readonly AdminRole[] = ["superadmin", "admin", "teamlead"];

export type SessionPayload = {
  id: string;
  role: AdminRole;
  // Must match Admin.sessionVersion; incrementing it revokes the token.
  sv: number;
  exp: number;
};

export function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= MIN_SESSION_SECRET_LENGTH ? secret : null;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function importKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signSessionToken(payload: SessionPayload, secret: string) {
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret, "sign"), new TextEncoder().encode(encoded));
  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<SessionPayload | null> {
  const [encoded, signature, extra] = token?.split(".") ?? [];
  if (!encoded || !signature || extra !== undefined) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await importKey(secret, "verify"), fromBase64Url(signature), new TextEncoder().encode(encoded));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as Partial<SessionPayload>;
    if (typeof payload.id !== "string" || !ROLES.includes(payload.role as AdminRole)) return null;
    if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    // Tokens issued before session versions existed carry no `sv` and count as version 0.
    const sv = typeof payload.sv === "number" ? payload.sv : 0;
    return { id: payload.id, role: payload.role as AdminRole, sv, exp: payload.exp };
  } catch {
    return null;
  }
}
