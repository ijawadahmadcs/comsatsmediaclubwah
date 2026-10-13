import { v2 as cloudinary } from "cloudinary";
import { logServerError } from "@/lib/api";
import { CLOUDINARY_FOLDERS, IMAGE_FORMATS, UPLOAD_PURPOSES, type UploadPurpose } from "@/lib/mediaRules";

export { CLOUDINARY_FOLDERS, IMAGE_FORMATS };

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

/**
 * Signs a direct browser-to-Cloudinary upload. The signature covers the folder and the allowed
 * formats, so the browser cannot change them, and it expires after an hour.
 */
export function createSignedUpload(purpose: UploadPurpose) {
  const rules = UPLOAD_PURPOSES[purpose];
  const client = getCloudinary();
  const { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = client.config();
  const params = {
    timestamp: Math.floor(Date.now() / 1000),
    folder: rules.folder,
    allowed_formats: rules.formats.join(","),
  };
  const signature = client.utils.api_sign_request(params, apiSecret as string);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${rules.resourceType}/upload`,
    fields: { ...params, api_key: apiKey as string, signature },
    maxBytes: rules.maxBytes,
  };
}

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  asset_folder?: string;
  folder?: string;
};

/**
 * Looks up an asset that the browser says it uploaded, and checks it matches the upload rules.
 * Assets in the wrong place or over the size limit are deleted. Returns null if invalid.
 */
export async function verifyDirectUpload(publicId: string, purpose: UploadPurpose) {
  const rules = UPLOAD_PURPOSES[purpose];
  let resource: CloudinaryResource;
  try {
    resource = (await getCloudinary().api.resource(publicId, { resource_type: rules.resourceType })) as CloudinaryResource;
  } catch {
    return null;
  }
  // Fixed-folder accounts prefix the public id with the folder; dynamic-folder accounts report asset_folder.
  const inFolder =
    resource.public_id.startsWith(`${rules.folder}/`) || resource.asset_folder === rules.folder || resource.folder === rules.folder;
  const validFormat = (rules.formats as readonly string[]).includes(resource.format?.toLowerCase());
  if (!inFolder) return null;
  if (!validFormat || resource.bytes > rules.maxBytes) {
    await destroyCloudinaryAsset(resource.public_id, rules.resourceType);
    return null;
  }
  return { publicId: resource.public_id, secureUrl: resource.secure_url, resourceType: rules.resourceType };
}

export async function destroyCloudinaryAsset(publicId: string, resourceType: CloudinaryAsset["resourceType"]) {
  try {
    await getCloudinary().uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (error) {
    logServerError("[CLOUDINARY] Unable to delete asset", error);
  }
}

/** Deletes assets by URL. Best effort: failures are logged and never thrown. */
export async function destroyCloudinaryUrls(urls: (string | null | undefined)[]) {
  const assets = new Map<string, CloudinaryAsset>();
  for (const url of urls) {
    const asset = parseOwnCloudinaryUrl(url);
    if (asset) assets.set(`${asset.resourceType}:${asset.publicId}`, asset);
  }
  await Promise.all([...assets.values()].map((asset) => destroyCloudinaryAsset(asset.publicId, asset.resourceType)));
}
