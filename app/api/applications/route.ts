import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Application from "@/models/Application";
import { requireApiAdmin } from "@/lib/auth";

const requiredFields = [
  "fullName",
  "registrationNumber",
  "department",
  "semester",
  "contactNumber",
  "email",
  "areaOfInterest",
  "motivation",
] as const;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    const parsedBody: unknown = await request.json();

    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 },
      );
    }

    body = parsedBody as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request." },
      { status: 400 },
    );
  }

  if (requiredFields.some((field) => !isNonEmptyString(body[field]))) {
    return NextResponse.json(
      { success: false, message: "Please complete all required fields." },
      { status: 400 },
    );
  }

  const getString = (field: string) => body[field] as string;
  const email = getString("email").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, message: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  try {
    console.info("[APPLICATION] Public submission received");
    await connectToDatabase();

    await Application.create({
      fullName: getString("fullName").trim(),
      registrationNumber: getString("registrationNumber").trim(),
      department: getString("department").trim(),
      semester: getString("semester").trim(),
      contactNumber: getString("contactNumber").trim(),
      email,
      areaOfInterest: getString("areaOfInterest").trim(),
      image: isNonEmptyString(body.image) ? body.image.trim() : undefined,
      motivation: getString("motivation").trim(),
      expectations: isNonEmptyString(body.expectations)
        ? body.expectations.trim()
        : undefined,
    });
    console.info("[APPLICATION] Submission saved");

    return NextResponse.json(
      { success: true, message: "Application submitted successfully." },
      { status: 201 },
    );
  } catch (error) {
    console.error("[APPLICATION POST ERROR]", error instanceof Error ? { name: error.name, message: error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]") } : { name: "UnknownError" });
    return NextResponse.json(
      { success: false, message: "Unable to submit application." },
      { status: 500 },
    );
  }
}

export async function GET() {
  if (!(await requireApiAdmin())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    console.info("[APPLICATION] Admin list request received");
    await connectToDatabase();
    const applications = await Application.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, applications: applications.map((application) => ({ ...application, status: application.status || "Pending" })) });
  } catch (error) {
    console.error("[APPLICATION GET ERROR]", error instanceof Error ? { name: error.name, message: error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]") } : { name: "UnknownError" });
    return NextResponse.json({ success: false, message: "Unable to load applications." }, { status: 500 });
  }
}