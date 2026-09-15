import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiAdmin())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid application ID." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const application = await Application.findById(id);
    if (!application) return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });
    if (application.status !== "Accepted") return NextResponse.json({ success: false, message: "Only accepted applications can be added to the team." }, { status: 400 });

    const existing = await TeamMember.findOne({
      $or: [
        { applicationId: application._id },
        { registrationNumber: application.registrationNumber },
      ],
    });
    if (existing) {
      existing.applicationId = application._id;
      await existing.save();
      if (!application.teamMemberId || application.teamMemberId.toString() !== existing._id.toString()) {
        application.teamMemberId = existing._id;
        await application.save();
      }
      return NextResponse.json({ success: true, member: existing, alreadyAdded: true });
    }

    const lastMember = await TeamMember.findOne().sort({ order: -1 }).select("order").lean();
    const member = await TeamMember.create({
      applicationId: application._id,
      name: application.fullName,
      role: "General Member",
      department: application.department,
      registrationNumber: application.registrationNumber,
      contactNumber: application.contactNumber,
      semester: Number(application.semester) || undefined,
      areaOfInterest: application.areaOfInterest,
      image: application.image,
      order: (lastMember?.order ?? 0) + 1,
    });

    application.teamMemberId = member._id;
    await application.save();
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to add applicant to the team." }, { status: 500 });
  }
}