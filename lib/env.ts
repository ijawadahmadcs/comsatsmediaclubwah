import { MIN_SESSION_SECRET_LENGTH, getSessionSecret } from "@/lib/sessionToken";

/** Lists missing or invalid environment variables. Checked once at server start (instrumentation.ts). */
export function getEnvironmentProblems() {
  const problems: string[] = [];
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) problems.push("MONGODB_URI is not set");
  else if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) problems.push("MONGODB_URI must start with mongodb:// or mongodb+srv://");
  if (!getSessionSecret()) problems.push(`ADMIN_SESSION_SECRET must be set and at least ${MIN_SESSION_SECRET_LENGTH} characters long`);
  for (const name of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
    if (!process.env[name]?.trim()) problems.push(`${name} is not set`);
  }
  if (Boolean(process.env.TURNSTILE_SECRET_KEY?.trim()) !== Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())) {
    problems.push("Set both TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY, or neither");
  }
  return problems;
}
