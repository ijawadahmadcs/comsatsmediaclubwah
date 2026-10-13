// Browser-only: uploads a file straight to Cloudinary using a signature from our API.

import { UPLOAD_PURPOSES, formatMegabytes, type UploadPurpose } from "@/lib/mediaRules";

export type DirectUploadResult = {
  publicId: string;
  secureUrl: string;
  resourceType: "image" | "video";
};

type SignatureResponse = {
  success?: boolean;
  message?: string;
  uploadUrl: string;
  fields: Record<string, string | number>;
};

/** Returns an error message if the file does not fit the upload rules, otherwise null. */
export function checkUploadFile(file: File, purpose: UploadPurpose) {
  const rules = UPLOAD_PURPOSES[purpose];
  if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
    return rules.resourceType === "video" ? "Use an MP4, WEBM or MOV video." : "Use a JPEG, PNG or WEBP image.";
  }
  if (file.size > rules.maxBytes) return `This file must be ${formatMegabytes(rules.maxBytes)} or smaller.`;
  return null;
}

export async function uploadDirectToCloudinary(
  file: File,
  purpose: UploadPurpose,
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResult> {
  const fileError = checkUploadFile(file, purpose);
  if (fileError) throw new Error(fileError);

  const signatureResponse = await fetch("/api/uploads/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose }),
  });
  const signature = (await signatureResponse.json().catch(() => ({}))) as SignatureResponse;
  if (!signatureResponse.ok || !signature.success) {
    // `status` lets callers send the user to the login page when the session has expired (401).
    throw Object.assign(new Error(signature.message || "Unable to start the upload."), { status: signatureResponse.status });
  }

  const data = new FormData();
  for (const [key, value] of Object.entries(signature.fields)) data.append(key, String(value));
  data.append("file", file);

  // XMLHttpRequest (unlike fetch) reports upload progress, which matters for large videos.
  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", signature.uploadUrl);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(request.responseText);
      } catch {
        // handled below
      }
      if (request.status >= 200 && request.status < 300 && typeof body.public_id === "string") resolve(body);
      else reject(new Error((body.error as { message?: string } | undefined)?.message || "The upload to Cloudinary failed."));
    };
    request.onerror = () => reject(new Error("The upload failed. Check your connection and try again."));
    request.send(data);
  });

  return {
    publicId: result.public_id as string,
    secureUrl: result.secure_url as string,
    resourceType: result.resource_type === "video" ? "video" : "image",
  };
}
