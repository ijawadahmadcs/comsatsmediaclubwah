import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid image upload request." },
        { status: 400 },
      );
    }
    const file = formData.get("file");

    if (!(file instanceof File) || !allowedTypes.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPEG, PNG, and WEBP images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "Images must be 5 MB or smaller." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await new Promise<{ secure_url: string }>((resolve, reject) => {
      getCloudinary().uploader.upload_stream(
        { folder: "media-club/applications", resource_type: "image" },
        (error, result) => {
          if (error || !result?.secure_url) reject(error || new Error("Cloudinary upload failed"));
          else resolve({ secure_url: result.secure_url });
        },
      ).end(buffer);
    });

    return NextResponse.json({ success: true, image: upload.secure_url });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to upload image." },
      { status: 500 },
    );
  }
}