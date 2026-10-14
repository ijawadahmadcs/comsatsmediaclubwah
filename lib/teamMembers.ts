import type { Types } from "mongoose";
import { isDuplicateKeyError } from "@/lib/api";
import { isOwnCloudinaryImageUrl } from "@/lib/cloudinary";
import { isCoreRole, isLeadRole } from "@/lib/teamRoles";
import Application, { type IApplication } from "@/models/Application";
import Event from "@/models/Event";
import TeamMember, { type ITeamMember } from "@/models/TeamMember";

// TeamMember is the single source of truth for who is on the team. A member created from an
// application is only shown publicly (and in Team Lead rosters) while that application is Accepted.

export type MemberRecord = ITeamMember & { _id: Types.ObjectId };
type ApplicationRecord = IApplication & { _id: Types.ObjectId };

export type PublicMemberGroup = "core" | "lead" | "member";

export type PublicMember = {
  _id: string;
  name: string;
  role: string;
  group: PublicMemberGroup;
  order: number;
  image?: string;
  areaOfInterest?: string;
  contactNumber?: string;
};

/** Ids (as strings) of the applications in `applicationIds` that are currently Accepted. */
async function getAcceptedApplicationIds(applicationIds: Types.ObjectId[]) {
  if (!applicationIds.length) return new Set<string>();
  const accepted = await Application.find({ _id: { $in: applicationIds }, status: "Accepted" }).select("_id").lean();
  return new Set(accepted.map((application) => application._id.toString()));
}

export function isMemberVisible(member: Pick<ITeamMember, "applicationId">, acceptedApplicationIds: Set<string>) {
  return !member.applicationId || acceptedApplicationIds.has(member.applicationId.toString());
}

/** Members shown on the public site, in display order. */
export async function findVisibleMembers(): Promise<MemberRecord[]> {
  const members = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
  const acceptedIds = await getAcceptedApplicationIds(members.flatMap((member) => (member.applicationId ? [member.applicationId] : [])));
  return members.filter((member) => isMemberVisible(member, acceptedIds));
}

/**
 * Reduces members to what the public pages need. Phone numbers are published for core
 * office-bearers only; registration numbers, departments and links to applications never are.
 */
export function toPublicMembers(members: MemberRecord[]): PublicMember[] {
  const groupOf = (role: string): PublicMemberGroup => (isCoreRole(role) ? "core" : isLeadRole(role) ? "lead" : "member");
  // Someone holding a core or lead role may also have a general membership record from their application.
  const leaderRegistrations = new Set(
    members
      .filter((member) => groupOf(member.role) !== "member" && member.registrationNumber)
      .map((member) => member.registrationNumber!.trim().toUpperCase()),
  );
  return members.flatMap((member) => {
    const group = groupOf(member.role);
    if (group === "member" && member.registrationNumber && leaderRegistrations.has(member.registrationNumber.trim().toUpperCase())) return [];
    return [{
      _id: member._id.toString(),
      name: member.name,
      role: member.role,
      group,
      order: member.order ?? 0,
      image: isOwnCloudinaryImageUrl(member.image) ? member.image : undefined,
      areaOfInterest: member.areaOfInterest || undefined,
      contactNumber: group === "core" ? member.contactNumber || undefined : undefined,
    }];
  });
}

export type LinkResult =
  | { status: "created" | "linked"; member: MemberRecord }
  | { status: "conflict"; member: MemberRecord };

/**
 * Finds or creates the team member for an accepted application. A member found by registration
 * number is only linked if it is not already linked to a different application.
 */
export async function linkMemberToApplication(application: ApplicationRecord): Promise<LinkResult> {
  const linked = await TeamMember.findOne({ applicationId: application._id }).lean();
  if (linked) return { status: "linked", member: linked };

  const sameRegistration = await TeamMember.findOne({ registrationNumber: application.registrationNumber })
    .collation({ locale: "en", strength: 2 })
    .lean();
  if (sameRegistration) {
    if (sameRegistration.applicationId) return { status: "conflict", member: sameRegistration };
    const claimed = await TeamMember.findOneAndUpdate(
      { _id: sameRegistration._id, applicationId: null },
      { $set: { applicationId: application._id } },
      { returnDocument: "after" },
    ).lean();
    return claimed ? { status: "linked", member: claimed } : { status: "conflict", member: sameRegistration };
  }

  const lastMember = await TeamMember.findOne().sort({ order: -1 }).select("order").lean();
  try {
    const member = await TeamMember.create({
      applicationId: application._id,
      name: application.fullName,
      role: "General Member",
      department: application.department,
      registrationNumber: application.registrationNumber,
      team: application.areaOfInterest,
      contactNumber: application.contactNumber,
      semester: Number(application.semester) || undefined,
      areaOfInterest: application.areaOfInterest,
      image: isOwnCloudinaryImageUrl(application.image) ? application.image : undefined,
      order: (lastMember?.order ?? 0) + 1,
    });
    return { status: "created", member: member.toObject() };
  } catch (error) {
    // Two admins accepted the same application at once: use the member the other request created.
    if (!isDuplicateKeyError(error)) throw error;
    const existing = await TeamMember.findOne({ applicationId: application._id }).lean();
    if (!existing) throw error;
    return { status: "linked", member: existing };
  }
}

/** Removes deleted members from event assignments, attendance, ratings and remarks. */
export async function removeMembersFromEvents(memberIds: Types.ObjectId[]) {
  if (!memberIds.length) return;
  const unset = Object.fromEntries(memberIds.flatMap((id) => [[`ratings.${id}`, ""], [`remarks.${id}`, ""]]));
  await Event.updateMany(
    { $or: [{ assignedMembers: { $in: memberIds } }, { attendance: { $in: memberIds } }] },
    { $pull: { assignedMembers: { $in: memberIds }, attendance: { $in: memberIds } }, $unset: unset },
  );
}
