import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";
import { requireApiAdmin } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireApiAdmin();
  if (!admin) {
    console.warn("[UPLOAD] Unauthorized upload request", {
      hasCookie: request.headers.get("cookie")?.includes("media_club_admin_session") ?? false,
    });
    return NextResponse.json({ success: false, message: "Your admin session has expired. Please sign in again." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !allowedTypes.has(file.type)) {
      return NextResponse.json({ success: false, message: "Only JPEG, PNG, and WEBP images are allowed." }, { status: 400 });
    }
    if (file.size > maxSize) return NextResponse.json({ success: false, message: "Images must be 5 MB or smaller." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      getCloudinary().uploader.upload_stream({ folder: "media-club/team", resource_type: "image" }, (error, uploadResult) => {
        if (error || !uploadResult?.secure_url || !uploadResult.public_id) reject(error);
        else resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
      }).end(buffer);
    });
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to upload image." }, { status: 500 });
  }
}