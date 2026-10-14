import { afterEach, describe, expect, it, vi } from "vitest";
import { getSessionSecret, signSessionToken, verifySessionToken, type SessionPayload } from "@/lib/sessionToken";

const SECRET = "test-session-secret-0123456789-abcdefghij";
const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;
const payload = (overrides: Partial<SessionPayload> = {}): SessionPayload => ({
  id: "507f1f77bcf86cd799439011",
  role: "admin",
  sv: 3,
  exp: inOneHour(),
  ...overrides,
});

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session tokens", () => {
  it("round-trips a signed payload", async () => {
    const original = payload();
    expect(await verifySessionToken(await signSessionToken(original, SECRET), SECRET)).toEqual(original);
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await signSessionToken(payload(), SECRET);
    expect(await verifySessionToken(token, `${SECRET}-rotated`)).toBeNull();
  });

  it("rejects a payload that was changed after signing", async () => {
    const [, signature] = (await signSessionToken(payload(), SECRET)).split(".");
    expect(await verifySessionToken(`${encode(payload({ role: "superadmin" }))}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects expired tokens", async () => {
    const token = await signSessionToken(payload({ exp: Math.floor(Date.now() / 1000) - 1 }), SECRET);
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("rejects unknown roles even when correctly signed", async () => {
    const token = await signSessionToken({ ...payload(), role: "owner" } as unknown as SessionPayload, SECRET);
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it.each([undefined, "", "abc", "a.b.c", "not base64.!!!"])("rejects malformed token %j", async (token) => {
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("treats tokens issued before session versions existed as version 0", async () => {
    const legacy = { id: "507f1f77bcf86cd799439011", role: "admin", exp: inOneHour() };
    const token = await signSessionToken(legacy as SessionPayload, SECRET);
    expect((await verifySessionToken(token, SECRET))?.sv).toBe(0);
  });
});

describe("getSessionSecret", () => {
  it("refuses a missing or short secret", () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    expect(getSessionSecret()).toBeNull();
    vi.stubEnv("ADMIN_SESSION_SECRET", "x".repeat(31));
    expect(getSessionSecret()).toBeNull();
  });

  it("accepts a secret of at least 32 characters", () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
    expect(getSessionSecret()).toBe(SECRET);
  });
});
