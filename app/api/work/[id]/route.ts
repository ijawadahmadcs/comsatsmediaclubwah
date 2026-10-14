import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { jsonError, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getCloudinary } from "@/lib/cloudinary";
import WorkAsset from "@/models/WorkAsset";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError("Invalid work asset ID.", 400);

  try {
    await connectToDatabase();
    const asset = await WorkAsset.findById(id);
    if (!asset) return jsonError("Work asset not found.", 404);
    // Delete the file first; if Cloudinary fails, the record stays so the delete can be retried.
    await getCloudinary().uploader.destroy(asset.publicId, { resource_type: asset.resourceType, invalidate: true });
    await asset.deleteOne();
    await recordAudit(auth.account, { action: "work_asset_deleted", targetType: "work_asset", targetId: id, details: { publicId: asset.publicId, resourceType: asset.resourceType } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("[WORK DELETE ERROR]", error, "Unable to delete work asset.");
  }
}
