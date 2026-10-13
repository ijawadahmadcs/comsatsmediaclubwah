import { v2 as cloudinary } from "cloudinary";
import { logServerError } from "@/lib/api";

export const CLOUDINARY_FOLDERS = {
  applications: "media-club/applications",
  team: "media-club/team",
  work: "media-club/work",
} as const;

export const IMAGE_FORMATS = ["jpg", "png", "webp"] as const;
export const VIDEO_FORMATS = ["mp4", "webm", "mov"] as const;

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

export type CloudinaryAsset = { resourceType: "image" | "video"; publicId: string; format: string };

/**
 * Parses a delivery URL of an original upload on this Cloudinary account, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/v1700000000/media-club/team/abc123.jpg
 * Returns null for anything else, including other accounts, `fetch` URLs and URLs with transformations.
 */
export function parseOwnCloudinaryUrl(value: unknown): CloudinaryAsset | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName || typeof value !== "string" || value.length > 500) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.port || url.username || url.search || url.hash) return null;
  const prefix = `/${cloudName}/`;
  if (!url.pathname.startsWith(prefix)) return null;
  const match = /^(image|video)\/upload\/(?:v\d+\/)?([A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)\.([A-Za-z0-9]+)$/.exec(url.pathname.slice(prefix.length));
  if (!match) return null;
  return { resourceType: match[1] as CloudinaryAsset["resourceType"], publicId: match[2], format: match[3].toLowerCase() };
}

/** True for JPEG/PNG/WEBP images uploaded to this account. Used to reject or hide any other image URL. */
export function isOwnCloudinaryImageUrl(value: unknown): value is string {
  const asset = parseOwnCloudinaryUrl(value);
  return asset?.resourceType === "image" && ["jpg", "jpeg", "png", "webp"].includes(asset.format);
}

/** Uploads an image buffer. `allowed_formats` makes Cloudinary reject anything that is not JPEG/PNG/WEBP. */
export function uploadImageBuffer(buffer: Buffer, folder: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    getCloudinary()
      .uploader.upload_stream({ folder, resource_type: "image", allowed_formats: [...IMAGE_FORMATS] }, (error, result) => {
        if (error || !result?.secure_url || !result.public_id) reject(error || new Error("Cloudinary returned no upload result"));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id });
      })
      .end(buffer);
  });
}

/** Deletes assets by URL. Best effort: failures are logged and never thrown. */
export async function destroyCloudinaryUrls(urls: (string | null | undefined)[]) {
  const assets = new Map<string, CloudinaryAsset>();
  for (const url of urls) {
    const asset = parseOwnCloudinaryUrl(url);
    if (asset) assets.set(`${asset.resourceType}:${asset.publicId}`, asset);
  }
  await Promise.all(
    [...assets.values()].map(async (asset) => {
      try {
        await getCloudinary().uploader.destroy(asset.publicId, { resource_type: asset.resourceType, invalidate: true });
      } catch (error) {
        logServerError("[CLOUDINARY] Unable to delete asset", error);
      }
    }),
  );
}
