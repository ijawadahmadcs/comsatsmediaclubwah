import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { requireApiStaff } from "@/lib/auth";
import { createSignedUpload } from "@/lib/cloudinary";
import { isUploadPurpose } from "@/lib/mediaRules";

export const runtime = "nodejs";

/** POST /api/uploads/signature { purpose } — signs one direct upload to Cloudinary (staff only). */
export async function POST(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const body = await readJsonObject(request);
  if (!isUploadPurpose(body?.purpose)) return jsonError("Unknown upload type.", 400);
  try {
    return NextResponse.json({ success: true, ...createSignedUpload(body.purpose) });
  } catch (error) {
    return serverError("[UPLOAD SIGNATURE ERROR]", error, "Uploads are not available right now.");
  }
}
