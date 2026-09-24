import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getCloudinary } from "@/lib/cloudinary";
import WorkAsset from "@/models/WorkAsset";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiAdmin())) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid work asset ID." }, { status: 400 });

  try {
    await connectToDatabase();
    const asset = await WorkAsset.findById(id);
    if (!asset) return NextResponse.json({ success: false, message: "Work asset not found." }, { status: 404 });
    await getCloudinary().uploader.destroy(asset.publicId, { resource_type: asset.resourceType });
    await asset.deleteOne();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to delete work asset." }, { status: 500 });
  }
}