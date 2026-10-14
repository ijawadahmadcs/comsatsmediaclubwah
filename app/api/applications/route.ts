import { NextResponse } from "next/server";
import { jsonError, logServerError, serverError } from "@/lib/api";
import { buildApplicationFilter } from "@/lib/applicationFilters";
import { APPLICATION_IMAGE_MAX_BYTES, validateApplicationSubmission } from "@/lib/applicationRules";
import { requireApiStaff } from "@/lib/auth";
import { CLOUDINARY_FOLDERS, destroyCloudinaryUrls, isOwnCloudinaryImageUrl, uploadImageBuffer } from "@/lib/cloudinary";
import { detectImageType } from "@/lib/fileSignature";
import connectToDatabase from "@/lib/mongodb";
import { RATE_LIMITS, consumeRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import Application from "@/models/Application";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 100;

/**
 * Public application form. Expects multipart/form-data with the form fields, an optional `image`
 * file and, when CAPTCHA is enabled, `turnstileToken`. The server uploads the photo itself, so
 * applicants can never supply an arbitrary image URL.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return jsonError("Please submit the application using the form on the Join page.", 415);
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid application data.", 400);
  }

  const fields = Object.fromEntries([...formData.entries()].filter(([, value]) => typeof value === "string"));
  const parsed = validateApplicationSubmission(fields);
  if ("error" in parsed) return jsonError(parsed.error, 400);
  const submission = parsed.data;

  let imageBuffer: Buffer | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > APPLICATION_IMAGE_MAX_BYTES) return jsonError("Images must be 4 MB or smaller.", 400);
    imageBuffer = Buffer.from(await file.arrayBuffer());
    // Check the file's actual bytes; the browser-supplied MIME type can be faked.
    if (!detectImageType(imageBuffer)) return jsonError("Only JPEG, PNG, and WEBP images are allowed.", 400);
  }

  const ip = getClientIp(request);
  try {
    await connectToDatabase();
    const rateLimit = await consumeRateLimit(RATE_LIMITS.applicationPerIp, ip);
    if (rateLimit.limited) {
      return jsonError("Too many applications from this network. Please try again later.", 429, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      });
    }
    if (!(await verifyTurnstileToken(fields.turnstileToken, ip))) {
      return jsonError("Please complete the security check and try again.", 400);
    }

    // One active application per registration number. Rejected applicants may apply again.
    const existing = await Application.findOne({
      registrationNumber: submission.registrationNumber,
      status: { $in: ["Pending", "Reviewed", "Accepted", null] },
    })
      .collation({ locale: "en", strength: 2 })
      .select("status")
      .lean();
    if (existing) {
      return jsonError(
        existing.status === "Accepted"
          ? "This registration number already belongs to an accepted member."
          : "An application with this registration number is already being reviewed.",
        409,
      );
    }

    const image = imageBuffer ? (await uploadImageBuffer(imageBuffer, CLOUDINARY_FOLDERS.applications)).secure_url : undefined;
    try {
      await Application.create({ ...submission, image });
    } catch (error) {
      await destroyCloudinaryUrls([image]);
      throw error;
    }
    console.info("[APPLICATION] Submission saved");
    return NextResponse.json({ success: true, message: "Application submitted successfully." }, { status: 201 });
  } catch (error) {
    logServerError("[APPLICATION POST ERROR]", error);
    return jsonError("Unable to submit application. Please try again.", 500);
  }
}

/** Admin list: GET /api/applications?page=1&pageSize=25&status=…&semester=…&areaOfInterest=…&paymentStatus=…&search=… */
export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const requestedSize = Number.parseInt(params.get("pageSize") ?? "25", 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10_000) : 1;
  const pageSize = Number.isInteger(requestedSize) && requestedSize > 0 ? Math.min(requestedSize, MAX_PAGE_SIZE) : 25;
  const filter = buildApplicationFilter(params);

  try {
    await connectToDatabase();
    const [applications, total, semesters, interests, departments] = await Promise.all([
      Application.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      Application.countDocuments(filter),
      Application.distinct("semester"),
      Application.distinct("areaOfInterest"),
      Application.distinct("department"),
    ]);
    return NextResponse.json({
      success: true,
      page,
      pageSize,
      total,
      filterOptions: {
        semesters: semesters.map(String).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
        interests: interests.map(String).sort(),
        departments: departments.map(String).sort(),
      },
      applications: applications.map((application) => ({
        ...application,
        status: application.status || "Pending",
        paymentStatus: application.paymentStatus || "Unpaid",
        // Photos not uploaded through the site (possible before this was enforced) are never loaded.
        image: isOwnCloudinaryImageUrl(application.image) ? application.image : undefined,
      })),
    });
  } catch (error) {
    return serverError("[APPLICATION GET ERROR]", error, "Unable to load applications.");
  }
}
