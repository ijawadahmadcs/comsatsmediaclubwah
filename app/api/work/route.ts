import { NextResponse } from "next/server";
import { isDuplicateKeyError, jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiStaff } from "@/lib/auth";
import { destroyCloudinaryAsset, verifyDirectUpload } from "@/lib/cloudinary";
import connectToDatabase from "@/lib/mongodb";
import WorkAsset from "@/models/WorkAsset";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const assets = await WorkAsset.find().sort({ order: 1, createdAt: 1 }).select("url publicId resourceType order").lean();
    return NextResponse.json({ success: true, assets });
  } catch (error) {
    return serverError("[WORK GET ERROR]", error, "Unable to load work assets.");
  }
}

/**
 * Adds an image or video to the Work gallery after the browser has uploaded it directly to
 * Cloudinary. Body: { publicId, resourceType: "image" | "video" }.
 */
export async function POST(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const body = await readJsonObject(request);
  const publicId = body?.publicId;
  const resourceType = body?.resourceType;
  if (typeof publicId !== "string" || !publicId || publicId.length > 255 || (resourceType !== "image" && resourceType !== "video")) {
    return jsonError("Invalid upload details.", 400);
  }

  try {
    const upload = await verifyDirectUpload(publicId, resourceType === "image" ? "work-image" : "work-video");
    if (!upload) return jsonError("The uploaded file was not found or is not an allowed image or video.", 400);

    await connectToDatabase();
    const lastAsset = await WorkAsset.findOne().sort({ order: -1 }).select("order").lean();
    let asset;
    try {
      asset = await WorkAsset.create({ url: upload.secureUrl, publicId: upload.publicId, resourceType: upload.resourceType, order: (lastAsset?.order ?? 0) + 1 });
    } catch (error) {
      if (isDuplicateKeyError(error)) return jsonError("This file is already in the gallery.", 409);
      // Do not leave an orphaned file in Cloudinary when the database write fails.
      await destroyCloudinaryAsset(upload.publicId, upload.resourceType);
      throw error;
    }
    await recordAudit(auth.account, { action: "work_asset_created", targetType: "work_asset", targetId: asset._id.toString(), details: { resourceType: asset.resourceType } });
    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch (error) {
    return serverError("[WORK POST ERROR]", error, "Unable to add work media.");
  }
}
