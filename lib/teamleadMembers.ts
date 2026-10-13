import Application from "@/models/Application";
import TeamMember from "@/models/TeamMember";
import { getTeamScope } from "@/lib/teamScope";

/** Ids of the team members a Team Lead may assign: members of accepted applications in the lead's team. */
export async function getApprovedTeamMemberIds(team: string) {
  const applications = await Application.find({
    status: "Accepted",
    areaOfInterest: { $in: getTeamScope(team) },
  })
    .select("_id registrationNumber")
    .lean();

  if (!applications.length) return [];

  const members = await TeamMember.find({
    $or: [
      { applicationId: { $in: applications.map((application) => application._id) } },
      // Older members were matched to their application by registration number only.
      { applicationId: null, registrationNumber: { $in: applications.map((application) => application.registrationNumber) } },
    ],
  })
    .select("_id")
    .lean();

  return members.map((member) => member._id.toString());
}
