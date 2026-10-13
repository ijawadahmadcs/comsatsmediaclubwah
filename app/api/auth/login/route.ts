import { handlePasswordLogin } from "@/lib/login";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handlePasswordLogin(request, "admin");
}
