// Media folders and upload limits, shared by the admin UI (client) and the API (server).

export const CLOUDINARY_FOLDERS = {
  applications: "media-club/applications",
  team: "media-club/team",
  work: "media-club/work",
} as const;

export const IMAGE_FORMATS = ["jpg", "png", "webp"] as const;
export const VIDEO_FORMATS = ["mp4", "webm", "mov"] as const;

const MB = 1024 * 1024;

/**
 * Admin uploads go from the browser straight to Cloudinary using a short-lived signature from
 * POST /api/uploads/signature, so they are not limited by Vercel's 4.5 MB request-body limit.
 */
export const UPLOAD_PURPOSES = {
  "team-photo": {
    resourceType: "image",
    folder: CLOUDINARY_FOLDERS.team,
    formats: IMAGE_FORMATS,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 5 * MB,
  },
  "work-image": {
    resourceType: "image",
    folder: CLOUDINARY_FOLDERS.work,
    formats: IMAGE_FORMATS,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 5 * MB,
  },
  "work-video": {
    resourceType: "video",
    folder: CLOUDINARY_FOLDERS.work,
    formats: VIDEO_FORMATS,
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    maxBytes: 50 * MB,
  },
} as const;

export type UploadPurpose = keyof typeof UPLOAD_PURPOSES;

export function isUploadPurpose(value: unknown): value is UploadPurpose {
  return typeof value === "string" && Object.hasOwn(UPLOAD_PURPOSES, value);
}

export function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / MB)} MB`;
}
