import { handlePasswordLogin } from "@/lib/login";

export const runtime = "nodejs";

/** Team Lead sign-in. Uses the shared session cookie but only accepts Team Lead accounts. */
export function POST(request: Request) {
  return handlePasswordLogin(request, "teamlead");
}
