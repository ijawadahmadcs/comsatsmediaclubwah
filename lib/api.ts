import { NextResponse } from "next/server";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// Admin pages read `message`, Team Lead pages read `error`; send both so every client shows the reason.
export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ success: false, message, error: message }, { status, headers });
}

export function redactError(error: unknown) {
  if (!(error instanceof Error)) return { name: "UnknownError" };
  return {
    name: error.name,
    message: error.message
      .replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]")
      .replace(/(api_secret|api_key|cloudinary:\/\/)[^\s]+/gi, "[redacted]"),
  };
}

export function logServerError(scope: string, error: unknown) {
  console.error(scope, redactError(error));
}

export function serverError(scope: string, error: unknown, message: string) {
  logServerError(scope, error);
  return jsonError(message, 500);
}

export function isDuplicateKeyError(error: unknown) {
  return Boolean(error) && typeof error === "object" && (error as { code?: unknown }).code === 11000;
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}
