import type { Types } from "mongoose";
import { isDuplicateKeyError } from "@/lib/api";
import { isOwnCloudinaryImageUrl } from "@/lib/cloudinary";
import { isCoreRole, isLeadRole, coreRoleRank } from "@/lib/teamRoles";
import Application, { type IApplication } from "@/models/Application";
import Event from "@/models/Event";
import TeamMember, { type ITeamMember } from "@/models/TeamMember";

// TeamMember is the single source of truth for who is on the team. A member created from an
// application is only shown publicly (and in Team Lead rosters) while that application is Accepted.

export type MemberRecord = ITeamMember & { _id: Types.ObjectId };
type ApplicationRecord = IApplication & { _id: Types.ObjectId };

export function compareClubMemberIds(left?: string, right?: string) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  const leftNumber = /^CMC-(\d+)$/i.exec(left)?.[1];
  const rightNumber = /^CMC-(\d+)$/i.exec(right)?.[1];
  if (leftNumber && rightNumber) return Number(leftNumber) - Number(rightNumber);
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

const LEAD_TEAM_RANK = [
  "Photography Lead",
  "Videography Lead",
  "Graphics Lead",
  "Video Editing Lead",
  "Content Creation Lead",
] as const;

export function buildClubMemberIdOrder(members: Array<{
  _id: Types.ObjectId;
  name: string;
  role: string;
  createdAt?: Date;
  applicationId?: Types.ObjectId;
  acceptedAt?: Date;
}>) {
  const normalizeRoleName = (role: string) => role.trim().toLowerCase().replace(/\s*\/\s*/g, "/");

  const core = members
    .filter((member) => isCoreRole(member.role) && !normalizeRoleName(member.role).includes("advisor"))
    .sort((left, right) =>
      coreRoleRank(left.role) - coreRoleRank(right.role) ||
      (left.acceptedAt?.getTime() ?? left.createdAt?.getTime() ?? 0) - (right.acceptedAt?.getTime() ?? right.createdAt?.getTime() ?? 0) ||
      left.name.localeCompare(right.name),
    );

  const leads = members
    .filter((member) => isLeadRole(member.role) && !normalizeRoleName(member.role).includes("advisor"))
    .sort((left, right) => {
      const leftRank = LEAD_TEAM_RANK.findIndex((role) => normalizeRoleName(role).replace(/\s+/g, "") === normalizeRoleName(left.role).replace(/\s+/g, ""));
      const rightRank = LEAD_TEAM_RANK.findIndex((role) => normalizeRoleName(role).replace(/\s+/g, "") === normalizeRoleName(right.role).replace(/\s+/g, ""));
      return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank) ||
        (left.acceptedAt?.getTime() ?? left.createdAt?.getTime() ?? 0) - (right.acceptedAt?.getTime() ?? right.createdAt?.getTime() ?? 0) ||
        left.name.localeCompare(right.name);
    });

  const advisorsAndOthers = members.filter((member) =>
    normalizeRoleName(member.role).includes("advisor"),
  );

  const remaining = members
    .filter((member) =>
      !isCoreRole(member.role) &&
      !isLeadRole(member.role) &&
      !normalizeRoleName(member.role).includes("advisor"),
    )
    .sort((left, right) =>
      (left.acceptedAt?.getTime() ?? left.createdAt?.getTime() ?? 0) - (right.acceptedAt?.getTime() ?? right.createdAt?.getTime() ?? 0) ||
      left.name.localeCompare(right.name),
    );

  return {
    ordered: [...core, ...leads, ...remaining],
    advisors: advisorsAndOthers,
  };
}

export async function ensureClubMemberIds() {
  const members = await TeamMember.find({})
    .sort({ createdAt: 1, _id: 1 })
    .select("_id name role createdAt applicationId")
    .lean();
  if (!members.length) return;

  const applicationIds = members.flatMap((member) => member.applicationId ? [member.applicationId] : []);
  const applications = applicationIds.length
    ? await Application.find({ _id: { $in: applicationIds } }).select("_id createdAt updatedAt status").lean()
    : [];
  const acceptedAtByApplication = new Map(
    applications.map((application) => [
      application._id.toString(),
      application.status === "Accepted" ? application.updatedAt : application.createdAt,
    ]),
  );
  const membersWithAcceptance = members.map((member) => ({
    ...member,
    acceptedAt: member.applicationId ? acceptedAtByApplication.get(member.applicationId.toString()) : member.createdAt,
  }));
  const { ordered, advisors } = buildClubMemberIdOrder(membersWithAcceptance);

  await TeamMember.updateMany({}, { $unset: { clubMemberId: "" } });

  for (const advisor of advisors) {
    await TeamMember.updateOne({ _id: advisor._id }, { $unset: { clubMemberId: "" } });
  }

  for (const [index, member] of ordered.entries()) {
    await TeamMember.updateOne(
      { _id: member._id },
      { $set: { clubMemberId: `CMC-${String(index + 1).padStart(3, "0")}` } },
    );
  }
}

export type PublicMemberGroup = "core" | "lead" | "member";

export type PublicMember = {
  _id: string;
  name: string;
  role: string;
  group: PublicMemberGroup;
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
  const members = await TeamMember.find().lean();
  const acceptedIds = await getAcceptedApplicationIds(members.flatMap((member) => (member.applicationId ? [member.applicationId] : [])));
  return members
    .filter((member) => isMemberVisible(member, acceptedIds))
    .sort((left, right) => compareClubMemberIds(left.clubMemberId, right.clubMemberId));
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
    });
    await ensureClubMemberIds();
    const completeMember = await TeamMember.findById(member._id).lean();
    if (completeMember) return { status: "created", member: completeMember };
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
