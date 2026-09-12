import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Application from "@/models/Application";

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
    await connectToDatabase();

    await Application.create({
      fullName: getString("fullName").trim(),
      registrationNumber: getString("registrationNumber").trim(),
      department: getString("department").trim(),
      semester: getString("semester").trim(),
      contactNumber: getString("contactNumber").trim(),
      email,
      areaOfInterest: getString("areaOfInterest").trim(),
      motivation: getString("motivation").trim(),
      expectations: isNonEmptyString(body.expectations)
        ? body.expectations.trim()
        : undefined,
    });

    return NextResponse.json(
      { success: true, message: "Application submitted successfully." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to submit application." },
      { status: 500 },
    );
  }
}