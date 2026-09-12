import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { requireApiAdmin } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const editableFields = [
  "name",
  "role",
  "department",
  "registrationNumber",
  "contactNumber",
  "semester",
  "areaOfInterest",
  "bio",
  "image",
  "instagram",
  "facebook",
  "linkedin",
  "order",
] as const;

function getObjectId(id: string) {
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;
}

function parseUpdates(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};

  for (const field of editableFields) {
    if (body[field] === undefined) continue;

    if (["semester", "order"].includes(field)) {
      if (body[field] === "") {
        updates[field] = undefined;
        continue;
      }
      const value = Number(body[field]);
      if (!Number.isInteger(value) || (field === "semester" && value < 1)) {
        return { error: `${field === "semester" ? "Semester" : "Display order"} must be a valid whole number.` } as const;
      }
      updates[field] = value;
      continue;
    }

    if (typeof body[field] !== "string") {
      return { error: "Invalid team member data." } as const;
    }
    if (["name", "role"].includes(field) && body[field].trim().length === 0) {
      return { error: "Name and role are required." } as const;
    }
    updates[field] = body[field].trim();
  }

  return { updates } as const;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const objectId = getObjectId(id);
  if (!objectId) {
    return NextResponse.json({ success: false, message: "Invalid team member ID." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const member = await TeamMember.findById(objectId).lean();
    if (!member) {
      return NextResponse.json({ success: false, message: "Team member not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, member });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to load team member." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await requireApiAdmin())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;
  const objectId = getObjectId(id);
  if (!objectId) {
    return NextResponse.json({ success: false, message: "Invalid team member ID." }, { status: 400 });
  }

  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ success: false, message: "Invalid request data." }, { status: 400 });
    }
    const parsed = parseUpdates(body);
    if ("error" in parsed) {
      return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    }

    await connectToDatabase();
    const member = await TeamMember.findByIdAndUpdate(objectId, parsed.updates, {
      new: true,
      runValidators: true,
    });
    if (!member) {
      return NextResponse.json({ success: false, message: "Team member not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, member });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to update team member." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await requireApiAdmin())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  const { id } = await params;
  const objectId = getObjectId(id);
  if (!objectId) {
    return NextResponse.json({ success: false, message: "Invalid team member ID." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const member = await TeamMember.findByIdAndDelete(objectId);
    if (!member) {
      return NextResponse.json({ success: false, message: "Team member not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Team member deleted." });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to delete team member." }, { status: 500 });
  }
}