import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { requireApiStaff } from "@/lib/auth";
import { isOwnCloudinaryImageUrl } from "@/lib/cloudinary";
import { destroyUnreferencedImages } from "@/lib/mediaCleanup";
import connectToDatabase from "@/lib/mongodb";
import { parseMemberInput } from "@/lib/teamMemberInput";
import { removeMembersFromEvents } from "@/lib/teamMembers";
import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";

type RouteContext = { params: Promise<{ id: string }> };

const invalidId = () => jsonError("Invalid team member ID.", 400);
const notFound = () => jsonError("Team member not found.", 404);

/** Full member record, including contact details: staff only. */
export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return invalidId();
  try {
    await connectToDatabase();
    const member = await TeamMember.findById(id).lean();
    if (!member) return notFound();
    return NextResponse.json({ success: true, member });
  } catch (error) {
    return serverError("[TEAM MEMBER GET ERROR]", error, "Unable to load team member.");
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return invalidId();
  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  const parsed = parseMemberInput(body, "update");
  if ("error" in parsed) return jsonError(parsed.error, 400);

  try {
    await connectToDatabase();
    const current = await TeamMember.findById(id).lean();
    if (!current) return notFound();
    // A changed photo must be one of our own uploads; an unchanged legacy value is left alone.
    if (parsed.set.image && parsed.set.image !== current.image && !isOwnCloudinaryImageUrl(parsed.set.image)) {
      return jsonError("Photos must be uploaded through the admin panel.", 400);
    }
    const update = {
      ...(Object.keys(parsed.set).length ? { $set: parsed.set } : {}),
      ...(Object.keys(parsed.unset).length ? { $unset: parsed.unset } : {}),
    };
    if (!Object.keys(update).length) return jsonError("No changes provided.", 400);
    const member = await TeamMember.findByIdAndUpdate(id, update, { returnDocument: "after", runValidators: true }).lean();
    if (!member) return notFound();
    if (current.image && current.image !== member.image) await destroyUnreferencedImages([current.image]);

    await recordAudit(auth.account, {
      action: "team_member_updated",
      targetType: "team_member",
      targetId: id,
      details: { name: member.name, fields: [...Object.keys(parsed.set), ...Object.keys(parsed.unset)] },
    });
    return NextResponse.json({ success: true, member });
  } catch (error) {
    return serverError("[TEAM MEMBER PUT ERROR]", error, "Unable to update team member.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return invalidId();
  try {
    await connectToDatabase();
    const member = await TeamMember.findByIdAndDelete(id).lean();
    if (!member) return notFound();
    if (member.applicationId) {
      await Application.updateOne({ _id: member.applicationId, teamMemberId: member._id }, { $unset: { teamMemberId: 1 }, $set: { updatedAt: new Date() } });
    }
    await removeMembersFromEvents([member._id]);
    await destroyUnreferencedImages([member.image]);
    await recordAudit(auth.account, {
      action: "team_member_deleted",
      targetType: "team_member",
      targetId: id,
      details: { name: member.name, role: member.role, applicationId: member.applicationId?.toString() },
    });
    return NextResponse.json({ success: true, message: "Team member deleted." });
  } catch (error) {
    return serverError("[TEAM MEMBER DELETE ERROR]", error, "Unable to delete team member.");
  }
}
