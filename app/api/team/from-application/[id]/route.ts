import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { jsonError, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { linkMemberToApplication } from "@/lib/teamMembers";
import Application from "@/models/Application";

/** "Add to team" for an accepted application that has no team member yet. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError("Invalid application ID.", 400);

  try {
    await connectToDatabase();
    const application = await Application.findById(id).lean();
    if (!application) return jsonError("Application not found.", 404);
    if (application.status !== "Accepted") return jsonError("Only accepted applications can be added to the team.", 400);

    const link = await linkMemberToApplication(application);
    if (link.status === "conflict") {
      return jsonError(
        `A team member with registration number ${application.registrationNumber} already belongs to another application. Remove the duplicate application or member first.`,
        409,
      );
    }
    if (application.teamMemberId?.toString() !== link.member._id.toString()) {
      await Application.updateOne({ _id: application._id }, { $set: { teamMemberId: link.member._id, updatedAt: new Date() } });
    }
    if (link.status === "created") {
      await recordAudit(auth.account, {
        action: "team_member_created",
        targetType: "team_member",
        targetId: link.member._id.toString(),
        details: { name: link.member.name, fromApplication: id },
      });
    }
    return NextResponse.json(
      { success: true, member: link.member, alreadyAdded: link.status === "linked" },
      { status: link.status === "created" ? 201 : 200 },
    );
  } catch (error) {
    return serverError("[TEAM FROM APPLICATION ERROR]", error, "Unable to add applicant to the team.");
  }
}
