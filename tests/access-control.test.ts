import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { requireApiSession, requireApiStaff, requireApiSuperAdmin } from "@/lib/auth";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { SESSION_COOKIE, signSessionToken } from "@/lib/sessionToken";
import type { AdminRole } from "@/models/Admin";

// The guards read the session cookie, connect to MongoDB and re-read the account. All three are
// replaced here, so the tests run without a database.
const state = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  account: null as Record<string, unknown> | null,
  databaseError: null as Error | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (state.cookies.has(name) ? { name, value: state.cookies.get(name) } : undefined),
  }),
}));

vi.mock("@/lib/mongodb", () => ({
  default: async () => {
    if (state.databaseError) throw state.databaseError;
  },
}));

vi.mock("@/models/Admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/models/Admin")>()),
  default: {
    findById: () => ({
      lean: async () => {
        if (state.databaseError) throw state.databaseError;
        return state.account;
      },
    }),
  },
}));

const SECRET = "test-session-secret-0123456789-abcdefghij";
const ACCOUNT_ID = "507f1f77bcf86cd799439011";
const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

type Method = (typeof METHODS)[number];
type Access = "public" | "session" | "staff" | "superadmin" | "teamlead";
type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Response | Promise<Response>;

// Who may call each API handler (see Appendix B of the security report). Every exported handler
// must be listed, so a new route cannot be added without deciding who is allowed to use it.
const ACCESS: Record<string, Partial<Record<Method, Access>>> = {
  "admin/activity": { GET: "superadmin" },
  "admin/stats": { GET: "staff" },
  "admin/team": { GET: "staff" },
  "admin/team-leads": { GET: "superadmin" },
  "admin/team-leads/[id]": { GET: "superadmin", PUT: "superadmin", DELETE: "superadmin" },
  "admin/team-leads/create": { POST: "superadmin" },
  admins: { GET: "superadmin", POST: "superadmin" },
  "admins/[id]": { PATCH: "superadmin", DELETE: "superadmin" },
  applications: { GET: "staff", POST: "public" },
  "applications/[id]": { PATCH: "staff", DELETE: "staff" },
  "applications/export": { GET: "staff" },
  "auth/login": { POST: "public" },
  // Clears the cookie, and revokes the session when there is one.
  "auth/logout": { POST: "public" },
  "auth/me": { GET: "session" },
  health: { GET: "public" },
  team: { GET: "public", POST: "staff" },
  "team/[id]": { GET: "staff", PUT: "staff", DELETE: "staff" },
  "team/from-application/[id]": { POST: "staff" },
  "team-lead/auth/login": { POST: "public" },
  "team-lead/dashboard": { GET: "teamlead" },
  "team-lead/events": { GET: "teamlead", POST: "teamlead" },
  "team-lead/events/[id]": { GET: "teamlead", PUT: "teamlead", DELETE: "teamlead", POST: "teamlead" },
  "team-lead/members": { GET: "teamlead" },
  "uploads/signature": { POST: "staff" },
  work: { GET: "public", POST: "staff" },
  "work/[id]": { DELETE: "staff" },
};

const DENIED_ROLES: Record<Exclude<Access, "public">, AdminRole[]> = {
  session: [],
  staff: ["teamlead"],
  superadmin: ["admin", "teamlead"],
  teamlead: ["admin", "superadmin"],
};

const API_DIR = fileURLToPath(new URL("../app/api", import.meta.url));

function findRouteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findRouteFiles(fullPath);
    return entry.name === "route.ts" ? [fullPath] : [];
  });
}

const routeModules = new Map<string, Record<string, unknown>>();

async function signIn(role: AdminRole, options: { sv?: number; exp?: number; account?: Record<string, unknown> | null } = {}) {
  state.account =
    options.account === undefined
      ? {
          _id: ACCOUNT_ID,
          registrationNumber: "FA20-BCS-001",
          role,
          isActive: true,
          sessionVersion: 0,
          team: role === "teamlead" ? "Photography" : undefined,
        }
      : options.account;
  const token = await signSessionToken(
    { id: ACCOUNT_ID, role, sv: options.sv ?? 0, exp: options.exp ?? Math.floor(Date.now() / 1000) + 3600 },
    SECRET,
  );
  state.cookies.set(SESSION_COOKIE, token);
  return token;
}

function callRoute(route: string, method: Method) {
  const handler = routeModules.get(route)?.[method] as Handler;
  const url = `http://localhost/api/${route.replace("[id]", ACCOUNT_ID)}`;
  return handler(new Request(url, { method }), { params: Promise.resolve({ id: ACCOUNT_ID }) });
}

const guardedHandlers = Object.entries(ACCESS).flatMap(([route, methods]) =>
  Object.entries(methods).flatMap(([method, access]) =>
    access === "public" ? [] : [{ route, method: method as Method, access: access as Exclude<Access, "public"> }],
  ),
);

const deniedCalls = guardedHandlers.flatMap((handler) => DENIED_ROLES[handler.access].map((role) => ({ ...handler, role })));

beforeAll(async () => {
  vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
  for (const file of findRouteFiles(API_DIR)) {
    const route = path.relative(API_DIR, path.dirname(file)).split(path.sep).join("/");
    routeModules.set(route, await import(file.split(path.sep).join("/")));
  }
}, 120_000);

afterEach(() => {
  state.cookies.clear();
  state.account = null;
  state.databaseError = null;
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("API route access", () => {
  it("has an access rule for every exported route handler", () => {
    const exported = Object.fromEntries(
      [...routeModules].map(([route, module]) => [route, METHODS.filter((method) => typeof module[method] === "function")]),
    );
    const documented = Object.fromEntries(
      Object.entries(ACCESS).map(([route, methods]) => [route, METHODS.filter((method) => method in methods)]),
    );
    expect(exported).toEqual(documented);
  });

  it.each(guardedHandlers)("$method /api/$route returns 401 without a session", async ({ route, method }) => {
    const response = await callRoute(route, method);
    expect(response.status).toBe(401);
  });

  it.each(deniedCalls)("$method /api/$route returns 403 for the $role role", async ({ route, method, role }) => {
    await signIn(role);
    const response = await callRoute(route, method);
    expect(response.status).toBe(403);
  });
});

describe("session guards", () => {
  it.each<AdminRole>(["admin", "superadmin"])("requireApiStaff accepts %s accounts", async (role) => {
    await signIn(role);
    expect((await requireApiStaff()).ok).toBe(true);
  });

  it("requireApiSuperAdmin accepts superadmins", async () => {
    await signIn("superadmin");
    expect((await requireApiSuperAdmin()).ok).toBe(true);
  });

  it("requireTeamLead accepts Team Leads with a team and returns that team", async () => {
    await signIn("teamlead");
    const auth = await requireTeamLead();
    expect(auth.ok && auth.account.team).toBe("Photography");
  });

  it("requireTeamLead rejects a Team Lead account without a team", async () => {
    await signIn("teamlead", {
      account: { _id: ACCOUNT_ID, registrationNumber: "TL-1", role: "teamlead", isActive: true, sessionVersion: 0 },
    });
    const auth = await requireTeamLead();
    expect(auth.ok ? 200 : auth.response.status).toBe(403);
  });

  it("uses the role stored in the database, not the role in the cookie", async () => {
    await signIn("superadmin", {
      account: { _id: ACCOUNT_ID, registrationNumber: "FA20-BCS-001", role: "admin", isActive: true, sessionVersion: 0 },
    });
    const auth = await requireApiSuperAdmin();
    expect(auth.ok ? 200 : auth.response.status).toBe(403);
  });

  it("rejects a session after the account's session version changes (logout, password reset)", async () => {
    await signIn("admin", { sv: 2 });
    const auth = await requireApiSession();
    expect(auth.ok ? 200 : auth.response.status).toBe(401);
  });

  it("rejects deactivated accounts", async () => {
    await signIn("admin", {
      account: { _id: ACCOUNT_ID, registrationNumber: "FA20-BCS-001", role: "admin", isActive: false, sessionVersion: 0 },
    });
    const auth = await requireApiSession();
    expect(auth.ok ? 200 : auth.response.status).toBe(401);
  });

  it("rejects deleted accounts", async () => {
    await signIn("admin", { account: null });
    const auth = await requireApiSession();
    expect(auth.ok ? 200 : auth.response.status).toBe(401);
  });

  it("rejects expired sessions", async () => {
    await signIn("admin", { exp: Math.floor(Date.now() / 1000) - 1 });
    const auth = await requireApiSession();
    expect(auth.ok ? 200 : auth.response.status).toBe(401);
  });

  it("rejects a cookie whose payload was edited", async () => {
    const token = await signIn("admin");
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ id: ACCOUNT_ID, role: "superadmin", sv: 0, exp: 9999999999 })).toString("base64url");
    state.cookies.set(SESSION_COOKIE, `${forged}.${signature}`);
    const auth = await requireApiSession();
    expect(auth.ok ? 200 : auth.response.status).toBe(401);
  });

  it("returns 503, not 401, when the database is unavailable", async () => {
    await signIn("admin");
    state.databaseError = new Error("connection refused");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const auth = await requireApiSession();
    expect(auth.ok ? 200 : auth.response.status).toBe(503);
  });
});
