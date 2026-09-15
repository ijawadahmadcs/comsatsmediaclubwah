import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiAdmin())) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid application ID." }, { status: 400 });

  try {
    const body = await request.json();
    const allowed = ["Pending", "Reviewed", "Accepted", "Rejected"];
    if (!allowed.includes(body?.status)) return NextResponse.json({ success: false, message: "Invalid application status." }, { status: 400 });
    await connectToDatabase();
    const application = await Application.findByIdAndUpdate(id, { status: body.status, updatedAt: new Date() }, { new: true, runValidators: true }).lean();
    if (!application) return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });

    let teamMemberId = application.teamMemberId;
    if (body.status === "Accepted") {
      let member = await TeamMember.findOne({
        $or: [
          { applicationId: application._id },
          { registrationNumber: application.registrationNumber },
        ],
      });
      if (!member) {
        const lastMember = await TeamMember.findOne().sort({ order: -1 }).select("order").lean();
        member = await TeamMember.create({
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
      } else if (!member.applicationId) {
        member.applicationId = application._id;
        await member.save();
      }
      teamMemberId = member._id;
      await Application.findByIdAndUpdate(id, { teamMemberId, updatedAt: new Date() });
    }

    return NextResponse.json({ success: true, application: { ...application, status: application.status || "Pending", teamMemberId } });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to update application." }, { status: 500 });
  }
}