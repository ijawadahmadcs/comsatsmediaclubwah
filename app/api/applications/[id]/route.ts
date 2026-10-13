import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiStaff } from "@/lib/auth";
import { isOwnCloudinaryImageUrl } from "@/lib/cloudinary";
import { destroyUnreferencedImages } from "@/lib/mediaCleanup";
import connectToDatabase from "@/lib/mongodb";
import { linkMemberToApplication, removeMembersFromEvents } from "@/lib/teamMembers";
import Application, { APPLICATION_STATUSES, PAYMENT_STATUSES, type ApplicationStatus, type PaymentStatus } from "@/models/Application";
import TeamMember from "@/models/TeamMember";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError("Invalid application ID.", 400);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  if (body.status !== undefined && !APPLICATION_STATUSES.includes(body.status as ApplicationStatus)) return jsonError("Invalid application status.", 400);
  if (body.paymentStatus !== undefined && !PAYMENT_STATUSES.includes(body.paymentStatus as PaymentStatus)) return jsonError("Invalid payment status.", 400);
  if (body.status === undefined && body.paymentStatus === undefined) return jsonError("No application changes provided.", 400);
  const status = body.status as ApplicationStatus | undefined;
  const paymentStatus = body.paymentStatus as PaymentStatus | undefined;

  try {
    await connectToDatabase();
    const before = await Application.findById(id).lean();
    if (!before) return jsonError("Application not found.", 404);
    const application = await Application.findByIdAndUpdate(
      id,
      { $set: { ...(status ? { status } : {}), ...(paymentStatus ? { paymentStatus } : {}), updatedAt: new Date() } },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!application) return jsonError("Application not found.", 404);

    let teamMemberId = application.teamMemberId;
    let warning: string | undefined;
    if (application.status === "Accepted") {
      const link = await linkMemberToApplication(application);
      if (link.status === "conflict") {
        warning = `A team member with registration number ${application.registrationNumber} already belongs to another application, so no team member was created. Check for a duplicate application.`;
      } else {
        teamMemberId = link.member._id;
        if (application.teamMemberId?.toString() !== teamMemberId.toString()) {
          await Application.updateOne({ _id: id }, { $set: { teamMemberId } });
        }
      }
    }

    const changes = {
      ...(status && status !== (before.status || "Pending") ? { status: { from: before.status || "Pending", to: status } } : {}),
      ...(paymentStatus && paymentStatus !== (before.paymentStatus || "Unpaid")
        ? { paymentStatus: { from: before.paymentStatus || "Unpaid", to: paymentStatus } }
        : {}),
    };
    if (Object.keys(changes).length) {
      await recordAudit(auth.account, {
        action: "application_updated",
        targetType: "application",
        targetId: id,
        details: { fullName: application.fullName, registrationNumber: application.registrationNumber, changes },
      });
    }

    return NextResponse.json({
      success: true,
      warning,
      application: {
        ...application,
        status: application.status || "Pending",
        paymentStatus: application.paymentStatus || "Unpaid",
        image: isOwnCloudinaryImageUrl(application.image) ? application.image : undefined,
        teamMemberId,
      },
    });
  } catch (error) {
    return serverError("[APPLICATION PATCH ERROR]", error, "Unable to update application.");
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError("Invalid application ID.", 400);
  try {
    await connectToDatabase();
    const application = await Application.findById(id).lean();
    if (!application) return jsonError("Application not found.", 404);

    // Only delete the team member that was created from this application. A member found through a
    // matching registration number may belong to someone else (e.g. a duplicate application).
    const member = await TeamMember.findOne({ applicationId: application._id }).lean();
    if (member) {
      await TeamMember.deleteOne({ _id: member._id });
      await removeMembersFromEvents([member._id]);
    }
    await Application.deleteOne({ _id: application._id });
    await destroyUnreferencedImages([application.image, member?.image]);

    await recordAudit(auth.account, {
      action: "application_deleted",
      targetType: "application",
      targetId: id,
      details: {
        fullName: application.fullName,
        registrationNumber: application.registrationNumber,
        status: application.status || "Pending",
        paymentStatus: application.paymentStatus || "Unpaid",
        deletedTeamMemberId: member?._id.toString(),
      },
    });
    return NextResponse.json({ success: true, message: member ? "Application and its team record deleted." : "Application deleted." });
  } catch (error) {
    return serverError("[APPLICATION DELETE ERROR]", error, "Unable to delete application.");
  }
}
