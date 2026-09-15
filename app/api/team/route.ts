import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import Application from "@/models/Application";
import { requireApiAdmin } from "@/lib/auth";

const optionalStringFields = [
  "department",
  "registrationNumber",
  "contactNumber",
  "areaOfInterest",
  "bio",
  "image",
  "instagram",
  "facebook",
  "linkedin",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const parseMember = (body: Record<string, unknown>) => {
  if (!isNonEmptyString(body.name) || !isNonEmptyString(body.role)) {
    return { error: "Name and role are required." } as const;
  }

  const member: Record<string, unknown> = {
    name: body.name.trim(),
    role: body.role.trim(),
  };

  for (const field of optionalStringFields) {
    if (typeof body[field] === "string") {
      member[field] = body[field].trim();
    }
  }

  if (body.semester !== undefined && body.semester !== "") {
    const semester = Number(body.semester);
    if (!Number.isInteger(semester) || semester < 1) {
      return { error: "Semester must be a positive whole number." } as const;
    }
    member.semester = semester;
  }

  if (body.order !== undefined && body.order !== "") {
    const order = Number(body.order);
    if (!Number.isInteger(order)) {
      return { error: "Display order must be a whole number." } as const;
    }
    member.order = order;
  }

  return { member } as const;
};

export async function GET() {
  try {
    console.info("[TEAM] Public team request received");
    await connectToDatabase();
    const [members, acceptedApplicants] = await Promise.all([
      TeamMember.find().sort({ order: 1, createdAt: 1 }).lean(),
      Application.find({ status: "Accepted" })
        .select("fullName registrationNumber department areaOfInterest image teamMemberId")
        .sort({ createdAt: 1 })
        .lean(),
    ]);
    console.info("[TEAM] Team lookup completed", { count: members.length, acceptedCount: acceptedApplicants.length });
    return NextResponse.json({ success: true, members, acceptedApplicants });
  } catch (error) {
    console.error("[TEAM GET ERROR]", error instanceof Error ? { name: error.name, message: error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]") } : { name: "UnknownError" });
    return NextResponse.json(
      { success: false, message: "Unable to load team members." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await requireApiAdmin())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request data." },
        { status: 400 },
      );
    }

    const parsed = parseMember(body);
    if ("error" in parsed) {
      return NextResponse.json(
        { success: false, message: parsed.error },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const member = await TeamMember.create(parsed.member);
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to create team member." },
      { status: 500 },
    );
  }
}