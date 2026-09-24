import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { getCloudinary } from "@/lib/cloudinary";
import WorkAsset from "@/models/WorkAsset";

export const runtime = "nodejs";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const videoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const maxImageSize = 5 * 1024 * 1024;
const maxVideoSize = 50 * 1024 * 1024;

export async function GET() {
  try {
    await connectToDatabase();
    const assets = await WorkAsset.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, assets });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to load work assets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireApiAdmin())) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ success: false, message: "Please select an image or video." }, { status: 400 });

    const isImage = imageTypes.has(file.type);
    const isVideo = videoTypes.has(file.type);
    if (!isImage && !isVideo) return NextResponse.json({ success: false, message: "Use JPEG, PNG, WEBP, MP4, WEBM, or MOV files." }, { status: 400 });
    if (file.size > (isImage ? maxImageSize : maxVideoSize)) return NextResponse.json({ success: false, message: `This file must be ${isImage ? "5 MB" : "50 MB"} or smaller.` }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await new Promise<{ secure_url: string; public_id: string; resource_type: "image" | "video" }>((resolve, reject) => {
      getCloudinary().uploader.upload_stream({ folder: "media-club/work", resource_type: "auto" }, (error, result) => {
        if (error || !result?.secure_url || !result.public_id || (result.resource_type !== "image" && result.resource_type !== "video")) reject(error || new Error("Invalid Cloudinary result"));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id, resource_type: result.resource_type });
      }).end(buffer);
    });

    await connectToDatabase();
    const lastAsset = await WorkAsset.findOne().sort({ order: -1 }).select("order").lean();
    const asset = await WorkAsset.create({ url: upload.secure_url, publicId: upload.public_id, resourceType: upload.resource_type, order: (lastAsset?.order ?? 0) + 1 });
    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to upload work media." }, { status: 500 });
  }
}