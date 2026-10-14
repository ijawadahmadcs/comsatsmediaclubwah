import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE, signSessionToken } from "@/lib/sessionToken";
import type { AdminRole } from "@/models/Admin";
import { proxy } from "@/proxy";

const SECRET = "test-session-secret-0123456789-abcdefghij";
const SITE = "https://club.example";

beforeAll(() => {
  vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

async function sessionCookie(role: AdminRole, secret = SECRET) {
  const token = await signSessionToken({ id: "507f1f77bcf86cd799439011", role, sv: 0, exp: Math.floor(Date.now() / 1000) + 3600 }, secret);
  return `${SESSION_COOKIE}=${token}`;
}

function apiRequest(method: string, headers: Record<string, string> = {}, url = `${SITE}/api/team`) {
  return new NextRequest(url, { method, headers });
}

function pageRequest(pathname: string, cookie?: string) {
  return new NextRequest(`${SITE}${pathname}`, { headers: cookie ? { cookie } : {} });
}

const passedThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

function redirectedTo(response: Response) {
  const location = response.headers.get("location");
  return response.status >= 300 && response.status < 400 && location ? new URL(location).pathname : null;
}

describe("proxy: cross-site request protection for the API", () => {
  it("allows same-origin JSON requests", async () => {
    const response = await proxy(apiRequest("POST", { origin: SITE, "content-type": "application/json" }));
    expect(passedThrough(response)).toBe(true);
  });

  it("allows same-origin requests behind a proxy that sets x-forwarded-host", async () => {
    const request = apiRequest("POST", { origin: SITE, "x-forwarded-host": "club.example" }, "http://localhost:3000/api/team");
    expect(passedThrough(await proxy(request))).toBe(true);
  });

  it("blocks requests from another origin", async () => {
    const response = await proxy(apiRequest("POST", { origin: "https://evil.example", "content-type": "application/json" }));
    expect(response.status).toBe(403);
  });

  it("blocks the opaque Origin sent by sandboxed frames", async () => {
    const response = await proxy(apiRequest("DELETE", { origin: "null" }));
    expect(response.status).toBe(403);
  });

  it("blocks cross-site requests identified by Fetch Metadata when there is no Origin", async () => {
    const response = await proxy(apiRequest("PATCH", { "sec-fetch-site": "cross-site" }));
    expect(response.status).toBe(403);
  });

  it("allows non-browser clients that send neither Origin nor Fetch Metadata", async () => {
    expect(passedThrough(await proxy(apiRequest("POST", { "content-type": "application/json" })))).toBe(true);
  });

  it.each(["text/plain", "application/x-www-form-urlencoded"])("rejects %s bodies, which HTML forms can send cross-site", async (type) => {
    const response = await proxy(apiRequest("POST", { origin: SITE, "content-type": type }));
    expect(response.status).toBe(415);
  });

  it("accepts multipart uploads", async () => {
    const response = await proxy(apiRequest("POST", { origin: SITE, "content-type": "multipart/form-data; boundary=x" }));
    expect(passedThrough(response)).toBe(true);
  });

  it("does not restrict reads", async () => {
    expect(passedThrough(await proxy(apiRequest("GET", { origin: "https://evil.example" })))).toBe(true);
  });
});

describe("proxy: portal redirects", () => {
  it.each(["/admin/login", "/team-lead/login"])("always serves %s", async (pathname) => {
    expect(passedThrough(await proxy(pageRequest(pathname)))).toBe(true);
  });

  it("sends signed-out visitors to the matching sign-in page", async () => {
    expect(redirectedTo(await proxy(pageRequest("/admin/applications")))).toBe("/admin/login");
    expect(redirectedTo(await proxy(pageRequest("/team-lead/events")))).toBe("/team-lead/login");
  });

  it.each<AdminRole>(["admin", "superadmin"])("lets %s accounts into the admin portal only", async (role) => {
    const cookie = await sessionCookie(role);
    expect(passedThrough(await proxy(pageRequest("/admin/team", cookie)))).toBe(true);
    expect(redirectedTo(await proxy(pageRequest("/team-lead/dashboard", cookie)))).toBe("/admin");
  });

  it("keeps Team Leads in the Team Lead portal", async () => {
    const cookie = await sessionCookie("teamlead");
    expect(passedThrough(await proxy(pageRequest("/team-lead/events", cookie)))).toBe(true);
    expect(redirectedTo(await proxy(pageRequest("/admin", cookie)))).toBe("/team-lead/dashboard");
  });

  it("treats a cookie signed with another secret as signed out", async () => {
    const cookie = await sessionCookie("superadmin", "another-secret-that-is-at-least-32-characters");
    expect(redirectedTo(await proxy(pageRequest("/admin", cookie)))).toBe("/admin/login");
  });
});
