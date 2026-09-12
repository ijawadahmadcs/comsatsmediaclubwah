import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Admin from "@/models/Admin";

export const SESSION_COOKIE = "media_club_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

export type AuthAdmin = {
  id: string;
  registrationNumber: string;
  name?: string;
  role: "admin" | "superadmin";
};

type SessionPayload = AuthAdmin & { exp: number };

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }
  return secret;
}

export function validateAuthRuntimeConfig() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  getSessionSecret();
  console.info("[AUTH] Runtime configuration validated", {
    hasMongoUri: true,
    hasSessionSecret: true,
    hasInitialAdminRegistrationNumber: Boolean(process.env.INITIAL_ADMIN_REGISTRATION_NUMBER),
    hasInitialAdminPassword: Boolean(process.env.INITIAL_ADMIN_PASSWORD),
  });
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createToken(payload: SessionPayload) {
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function verifyToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(decode(encoded)) as SessionPayload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

export function createAdminSession(admin: AuthAdmin) {
  const token = createToken({ ...admin, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE });
  console.info("[AUTH] Session signing completed");
  return { token, maxAge: SESSION_MAX_AGE };
}

export function setAdminSession(response: NextResponse, admin: AuthAdmin) {
  const session = createAdminSession(admin);
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export async function getCurrentAdmin(): Promise<AuthAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    console.warn("[AUTH] Session cookie not found");
    return null;
  }
  try {
    const admin = verifyToken(token);
    if (!admin) console.warn("[AUTH] Session cookie invalid or expired");
    return admin;
  } catch (error) {
    console.error("[AUTH] Session verification failed", error instanceof Error ? { name: error.name, message: error.message } : { name: "UnknownError" });
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();
  if (admin.role !== "superadmin") redirect("/admin");
  return admin;
}

export async function authenticateAdmin(registrationNumber: string, password: string) {
  await connectToDatabase();
  console.info("[AUTH] MongoDB connected");
  const admin = await Admin.findOne({ registrationNumber: registrationNumber.trim().toUpperCase() });
  console.info("[AUTH] Admin lookup completed", { found: Boolean(admin), active: Boolean(admin?.isActive) });
  if (!admin || !admin.isActive) return null;
  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, admin.passwordHash);
  console.info("[AUTH] Password verification completed", { valid });
  if (!valid) return null;
  return {
    id: admin._id.toString(),
    registrationNumber: admin.registrationNumber,
    name: admin.name,
    role: admin.role as AuthAdmin["role"],
  } satisfies AuthAdmin;
}

export async function requireApiAdmin() {
  const sessionAdmin = await getCurrentAdmin();
  if (!sessionAdmin) return null;
  try {
    await connectToDatabase();
    const admin = await Admin.findById(sessionAdmin.id).lean();
    if (!admin) {
      console.warn("[AUTH] Session admin no longer exists");
      return null;
    }
    if (!admin.isActive) {
      console.warn("[AUTH] Session admin is inactive");
      return null;
    }
    return {
      id: admin._id.toString(),
      registrationNumber: admin.registrationNumber,
      name: admin.name,
      role: admin.role as AuthAdmin["role"],
    } satisfies AuthAdmin;
  } catch (error) {
    console.error("[AUTH] Protected admin lookup failed", error instanceof Error ? { name: error.name, message: error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]") } : { name: "UnknownError" });
    return null;
  }
}

export async function requireApiSuperAdmin() {
  const admin = await requireApiAdmin();
  return admin?.role === "superadmin" ? admin : null;
}