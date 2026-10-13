import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { jsonError, logServerError } from "@/lib/api";
import connectToDatabase from "@/lib/mongodb";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  getSessionSecret,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/sessionToken";
import Admin, { type AdminRole } from "@/models/Admin";

export type AuthAdmin = {
  id: string;
  registrationNumber: string;
  name?: string;
  role: AdminRole;
  team?: string;
};

export type AuthResult<T extends AuthAdmin = AuthAdmin> =
  | { ok: true; account: T }
  | { ok: false; response: NextResponse };

type AuthenticatedAccount = AuthAdmin & { sessionVersion: number };

// bcrypt hash (cost 12) of a random string nobody knows. Compared against when an account does not
// exist, so sign-in takes the same time whether or not the registration number is registered.
const DUMMY_PASSWORD_HASH = "$2b$12$udq9HjFZ6ixVjZj0184aF.HuOVASvGq0Ac2HjMQa6wfGxwU8e8Qqq";

export const STAFF_ROLES: readonly AdminRole[] = ["admin", "superadmin"];

function requireSessionSecret() {
  const secret = getSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 characters long");
  return secret;
}

export function validateAuthRuntimeConfig() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  requireSessionSecret();
}

export function normalizeRegistrationNumber(value: string) {
  return value.trim().toUpperCase();
}

function toAuthAdmin(admin: { _id: { toString(): string }; registrationNumber: string; name?: string; role: AdminRole; team?: string }): AuthAdmin {
  return {
    id: admin._id.toString(),
    registrationNumber: admin.registrationNumber,
    name: admin.name,
    role: admin.role,
    team: admin.team,
  };
}

export async function setAdminSession(response: NextResponse, account: AuthenticatedAccount) {
  const token = await signSessionToken(
    { id: account.id, role: account.role, sv: account.sessionVersion, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE },
    requireSessionSecret(),
  );
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

/** Verifies the session cookie's signature and expiry. Does not check the database. */
export async function readSessionPayload(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, requireSessionSecret());
}

/** Increments the account's session version, which signs it out on every device. */
export async function revokeSessions(adminId: string) {
  await connectToDatabase();
  await Admin.updateOne({ _id: adminId }, { $inc: { sessionVersion: 1 } });
}

export async function authenticateAdmin(registrationNumber: string, password: string): Promise<AuthenticatedAccount | null> {
  await connectToDatabase();
  const admin = await Admin.findOne({ registrationNumber: normalizeRegistrationNumber(registrationNumber) }).lean();
  const bcrypt = await import("bcryptjs");
  // Always run exactly one bcrypt comparison so response times do not reveal which accounts exist.
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!admin || !admin.isActive || !valid) return null;
  return { ...toAuthAdmin(admin), sessionVersion: admin.sessionVersion ?? 0 };
}

type SessionLookup =
  | { status: "ok"; account: AuthAdmin }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

/** Resolves the signed-in account from the session cookie, re-reading it from the database. */
export async function getSessionAccount(): Promise<SessionLookup> {
  let payload: SessionPayload | null;
  try {
    payload = await readSessionPayload();
  } catch (error) {
    logServerError("[AUTH] Session verification failed", error);
    return { status: "unavailable" };
  }
  if (!payload) return { status: "unauthenticated" };

  try {
    await connectToDatabase();
    const admin = await Admin.findById(payload.id).lean();
    // A missing or inactive account, or a bumped session version, means the session was revoked.
    if (!admin || !admin.isActive || (admin.sessionVersion ?? 0) !== payload.sv) return { status: "unauthenticated" };
    return { status: "ok", account: toAuthAdmin(admin) };
  } catch (error) {
    logServerError("[AUTH] Account lookup failed", error);
    return { status: "unavailable" };
  }
}

async function requireApiRole(roles: readonly AdminRole[] | null): Promise<AuthResult> {
  const session = await getSessionAccount();
  if (session.status === "unavailable") {
    return { ok: false, response: jsonError("The service is temporarily unavailable. Please try again shortly.", 503) };
  }
  if (session.status === "unauthenticated") {
    return { ok: false, response: jsonError("Your session has expired. Please sign in again.", 401) };
  }
  if (roles && !roles.includes(session.account.role)) {
    return { ok: false, response: jsonError("You do not have permission to do that.", 403) };
  }
  return { ok: true, account: session.account };
}

/** Any signed-in, active account (admin, superadmin or Team Lead). Only for routes every role may use. */
export const requireApiSession = () => requireApiRole(null);

/** Admins and superadmins. Use this for every admin-portal API. */
export const requireApiStaff = () => requireApiRole(STAFF_ROLES);

export const requireApiSuperAdmin = () => requireApiRole(["superadmin"]);
